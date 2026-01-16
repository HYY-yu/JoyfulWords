#!/usr/bin/env tsx

/**
 * i18n Sync and Cleanup Script
 *
 * This script:
 * 1. Compares en.ts and zh.ts to find missing fields
 * 2. Searches codebase for i18n key usage
 * 3. Removes unused translation keys
 *
 * Usage:
 *   pnpm i18n:sync              - Sync and show report (dry run)
 *   pnpm i18n:sync --clean      - Remove unused keys
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface TranslationObject {
  [key: string]: string | TranslationObject
}

const PROJECT_ROOT = join(__dirname, '..')
const LOCALES_DIR = join(PROJECT_ROOT, 'lib', 'i18n', 'locales')
const EN_FILE = join(LOCALES_DIR, 'en.ts')
const ZH_FILE = join(LOCALES_DIR, 'zh.ts')

// CLI args
const args = process.argv.slice(2)
const CLEAN_UNUSED = args.includes('--clean')

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Extract translations from locale file
 */
function extractTranslations(filePath: string): TranslationObject {
  const content = readFileSync(filePath, 'utf-8')

  // Extract the exported object
  const match = content.match(/export\s+const\s+\w+\s*=\s*({[\s\S]*)/);
  if (!match) {
    throw new Error(`Could not extract translations from ${filePath}`)
  }

  // Use Function constructor to parse the object
  try {
    const objectStr = 'return ' + match[1]
    return new Function(objectStr)()
  } catch (error) {
    throw new Error(`Failed to parse translations from ${filePath}: ${error}`)
  }
}

/**
 * Get all translation keys recursively
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  let keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

/**
 * Recursively find missing keys
 */
function findMissingKeys(
  source: TranslationObject,
  target: TranslationObject,
  basePath = ''
): string[] {
  let missing: string[] = []

  for (const [key, value] of Object.entries(source)) {
    const path = basePath ? `${basePath}.${key}` : key

    if (!(key in target)) {
      missing.push(path)
    } else if (typeof value === 'object' && value !== null) {
      const targetValue = target[key]
      if (typeof targetValue === 'object' && targetValue !== null) {
        missing = missing.concat(findMissingKeys(value, targetValue, path))
      }
    }
  }

  return missing
}

/**
 * Recursively search files in directory
 */
function getAllFiles(dir: string, ext: string[]): string[] {
  let files: string[] = []

  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    // Skip node_modules and .next
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') {
      continue
    }

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, ext))
    } else if (entry.isFile()) {
      const fileExt = entry.name.split('.').pop()
      if (fileExt && ext.includes(fileExt)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

/**
 * Find i18n key usage in codebase
 */
function findKeyUsage(files: string[], keys: string[]): Set<string> {
  const usedKeys = new Set<string>()

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')

      // Match t("key") or t('key')
      const regex = /t\(['"`]([^'"`]+)['"`]\)/g
      let match

      while ((match = regex.exec(content)) !== null) {
        const key = match[1]
        if (keys.includes(key)) {
          usedKeys.add(key)
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return usedKeys
}

/**
 * Format translation object to TypeScript
 */
function formatTranslations(obj: TranslationObject, indent = 4): string {
  const spaces = ' '.repeat(indent)

  let result = '{\n'

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result += `${spaces}${key}: ${formatTranslations(value, indent + 4)},\n`
    } else {
      // Escape single quotes and backslashes
      const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      result += `${spaces}${key}: "${escaped}",\n`
    }
  }

  result += ' '.repeat(indent - 4) + '}'

  return result
}

/**
 * Write translations to file
 */
function writeTranslations(filePath: string, translations: TranslationObject) {
  const content = readFileSync(filePath, 'utf-8')

  // Find the export line
  const exportMatch = content.match(/export\s+const\s+\w+\s*=/)
  if (!exportMatch) {
    throw new Error(`Could not find export statement in ${filePath}`)
  }

  // Generate new content
  const newContent = `export const ${exportMatch[0].split(/\s+/)[2]} = ${formatTranslations(translations)};\n`

  // Preserve file header comments
  const lines = content.split('\n')
  const headerLines: string[] = []
  for (const line of lines) {
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim() === '') {
      headerLines.push(line)
    } else {
      break
    }
  }

  const header = headerLines.length > 0 ? headerLines.join('\n') + '\n\n' : ''

  writeFileSync(filePath, header + newContent, 'utf-8')
}

/**
 * Remove a key from translation object
 */
function removeKey(obj: TranslationObject, keyPath: string[]): boolean {
  const [first, ...rest] = keyPath

  if (!(first in obj)) {
    return false
  }

  if (rest.length === 0) {
    delete obj[first]
    return true
  }

  const value = obj[first]
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const removed = removeKey(value, rest)

  // Clean up empty objects
  if (removed && typeof value === 'object' && Object.keys(value).length === 0) {
    delete obj[first]
  }

  return removed
}

/**
 * Main sync function
 */
async function syncTranslations() {
  log('\n🔍 Analyzing translation files...\n', 'cyan')

  // Load translations
  const enTranslations = extractTranslations(EN_FILE)
  const zhTranslations = extractTranslations(ZH_FILE)

  // Find missing keys in both directions
  log('Finding missing keys...', 'blue')
  const missingInEn = findMissingKeys(zhTranslations, enTranslations)
  const missingInZh = findMissingKeys(enTranslations, zhTranslations)

  // Get all keys
  const allEnKeys = getAllKeys(enTranslations)
  const allZhKeys = getAllKeys(zhTranslations)

  // Report missing keys
  if (missingInEn.length > 0) {
    log(`\n❌ Missing in en.ts (${missingInEn.length} keys):`, 'red')
    missingInEn.forEach(key => log(`  - ${key}`, 'red'))
  }

  if (missingInZh.length > 0) {
    log(`\n❌ Missing in zh.ts (${missingInZh.length} keys):`, 'red')
    missingInZh.forEach(key => log(`  - ${key}`, 'red'))
  }

  if (missingInEn.length === 0 && missingInZh.length === 0) {
    log('\n✅ No missing keys found!', 'green')
  }

  // Clean unused keys
  if (CLEAN_UNUSED) {
    log('\n🧹 Checking for unused keys...', 'cyan')

    // Get all source files
    const sourceFiles = getAllFiles(PROJECT_ROOT, ['ts', 'tsx', 'js', 'jsx'])

    // Check en.ts
    const usedEnKeys = findKeyUsage(sourceFiles, allEnKeys)
    const unusedEnKeys = allEnKeys.filter(key => !usedEnKeys.has(key))

    // Check zh.ts
    const usedZhKeys = findKeyUsage(sourceFiles, allZhKeys)
    const unusedZhKeys = allZhKeys.filter(key => !usedZhKeys.has(key))

    log(`\n📊 Usage statistics:`, 'blue')
    log(`  en.ts: ${usedEnKeys.size}/${allEnKeys.length} keys used`, 'blue')
    log(`  zh.ts: ${usedZhKeys.size}/${allZhKeys.length} keys used`, 'blue')

    if (unusedEnKeys.length > 0) {
      log(`\n⚠️  Unused in en.ts (${unusedEnKeys.length} keys):`, 'yellow')
      unusedEnKeys.slice(0, 20).forEach(key => log(`  - ${key}`, 'yellow'))
      if (unusedEnKeys.length > 20) {
        log(`  ... and ${unusedEnKeys.length - 20} more`, 'yellow')
      }
    }

    if (unusedZhKeys.length > 0) {
      log(`\n⚠️  Unused in zh.ts (${unusedZhKeys.length} keys):`, 'yellow')
      unusedZhKeys.slice(0, 20).forEach(key => log(`  - ${key}`, 'yellow'))
      if (unusedZhKeys.length > 20) {
        log(`  ... and ${unusedZhKeys.length - 20} more`, 'yellow')
      }
    }

    if (unusedEnKeys.length === 0 && unusedZhKeys.length === 0) {
      log('\n✅ All keys are in use!', 'green')
    } else {
      log('\n🗑️  Removing unused keys...', 'yellow')

      if (unusedEnKeys.length > 0) {
        for (const key of unusedEnKeys) {
          const keyPath = key.split('.')
          removeKey(enTranslations, keyPath)
        }
        writeTranslations(EN_FILE, enTranslations)
        log(`  ✅ Removed ${unusedEnKeys.length} keys from en.ts`, 'green')
      }

      if (unusedZhKeys.length > 0) {
        for (const key of unusedZhKeys) {
          const keyPath = key.split('.')
          removeKey(zhTranslations, keyPath)
        }
        writeTranslations(ZH_FILE, zhTranslations)
        log(`  ✅ Removed ${unusedZhKeys.length} keys from zh.ts`, 'green')
      }
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue')
  if (!CLEAN_UNUSED) {
    log('🔍 DRY RUN - No changes made', 'yellow')
    log('Use --clean to remove unused keys', 'yellow')
  } else {
    log('✅ Cleanup completed!', 'green')
  }
  log('='.repeat(60) + '\n', 'blue')
}

// Run
syncTranslations().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
