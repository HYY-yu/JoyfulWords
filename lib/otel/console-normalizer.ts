'use client'

const PATCHED_KEY = '__joyfulWordsConsoleNormalizerInstalled'
const CONSOLE_LEVELS = ['debug', 'info', 'warn', 'error', 'log'] as const

type ConsoleLevel = (typeof CONSOLE_LEVELS)[number]
type ConsoleWithPatchState = Console & {
  [PATCHED_KEY]?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function quoteString(value: string): string {
  return JSON.stringify(value)
}

function formatError(error: Error): string {
  const parts = [
    `name=${quoteString(error.name || 'Error')}`,
    `message=${quoteString(error.message)}`,
  ]

  if (error.stack) {
    parts.push(`stack=${quoteString(error.stack)}`)
  }

  return `Error(${parts.join(' ')})`
}

function safeJsonStringify(value: unknown, seen = new WeakSet<object>()): string {
  return JSON.stringify(value, (_key, currentValue: unknown) => {
    if (typeof currentValue === 'bigint') {
      return `${currentValue.toString()}n`
    }

    if (currentValue instanceof Error) {
      return {
        name: currentValue.name,
        message: currentValue.message,
        stack: currentValue.stack,
      }
    }

    if (typeof currentValue === 'function') {
      return `[Function ${(currentValue as Function).name || 'anonymous'}]`
    }

    if (isRecord(currentValue)) {
      if (seen.has(currentValue)) {
        return '[Circular]'
      }
      seen.add(currentValue)
    }

    return currentValue
  }) ?? 'undefined'
}

function formatLogValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return quoteString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return `${value.toString()}n`
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (value instanceof Error) return formatError(value)

  return safeJsonStringify(value)
}

function formatContextObject(value: Record<string, unknown>): string {
  const entries = Object.entries(value)
  if (entries.length === 0) {
    return '{}'
  }

  return entries
    .map(([key, item]) => `${key}=${formatLogValue(item)}`)
    .join(' ')
}

function hasConsoleFormatter(value: string): boolean {
  return /%[sdifoOc]/.test(value)
}

export function normalizeConsoleArgs(args: unknown[]): unknown[] {
  if (args.length === 0) {
    return args
  }

  if (args.length === 1) {
    const [arg] = args
    if (typeof arg === 'string') {
      return args
    }
    if (arg instanceof Error) {
      return [formatError(arg)]
    }
    if (isRecord(arg)) {
      return [formatContextObject(arg)]
    }
    return [formatLogValue(arg)]
  }

  if (typeof args[0] === 'string' && hasConsoleFormatter(args[0])) {
    return args
  }

  return [
    args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg
        }
        if (arg instanceof Error) {
          return formatError(arg)
        }
        if (isRecord(arg)) {
          return formatContextObject(arg)
        }
        return formatLogValue(arg)
      })
      .join(' '),
  ]
}

export function installConsoleNormalizer() {
  if (typeof window === 'undefined') return

  const targetConsole = console as ConsoleWithPatchState
  if (targetConsole[PATCHED_KEY]) return

  CONSOLE_LEVELS.forEach((level: ConsoleLevel) => {
    const original = targetConsole[level].bind(targetConsole)
    targetConsole[level] = ((...args: unknown[]) => {
      original(...normalizeConsoleArgs(args))
    }) as Console[ConsoleLevel]
  })

  targetConsole[PATCHED_KEY] = true
}
