const SESSION_VERSION = 1
const STORAGE_PREFIX = "joyfulwords:presentation-v2"

export interface PresentationFlowSession {
  version: typeof SESSION_VERSION
  articleId: number
  userId: number
  generationId?: number
  templateKey?: string
  templateVersion?: number
  updatedAt: number
}

export function getPresentationFlowSessionKey(userId: number, articleId: number): string {
  return `${STORAGE_PREFIX}:${userId}:${articleId}`
}

function getBrowserStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage
}

export function loadPresentationFlowSession(
  userId: number,
  articleId: number,
  storage: Storage | null = getBrowserStorage()
): PresentationFlowSession | null {
  if (!storage) return null

  const key = getPresentationFlowSessionKey(userId, articleId)
  const raw = storage.getItem(key)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as Partial<PresentationFlowSession>
    if (
      session.version !== SESSION_VERSION ||
      session.userId !== userId ||
      session.articleId !== articleId ||
      typeof session.updatedAt !== "number"
    ) {
      storage.removeItem(key)
      return null
    }
    return session as PresentationFlowSession
  } catch (error) {
    console.warn("[PresentationV2] Clearing invalid flow session", {
      userId,
      articleId,
      error,
    })
    storage.removeItem(key)
    return null
  }
}

export function findLatestPresentationFlowSession(
  userId: number,
  storage: Storage | null = getBrowserStorage()
): PresentationFlowSession | null {
  if (!storage) return null

  const userPrefix = `${STORAGE_PREFIX}:${userId}:`
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key?.startsWith(userPrefix)))

  let latestSession: PresentationFlowSession | null = null
  for (const key of keys) {
    const articleId = Number(key.slice(userPrefix.length))
    if (!Number.isInteger(articleId) || articleId <= 0) continue

    const session = loadPresentationFlowSession(userId, articleId, storage)
    if (!session) continue
    if (!latestSession || session.updatedAt >= latestSession.updatedAt) {
      latestSession = session
    }
  }

  return latestSession
}

export function savePresentationFlowSession(
  session: Omit<PresentationFlowSession, "version" | "updatedAt">,
  storage: Storage | null = getBrowserStorage()
): PresentationFlowSession | null {
  if (!storage) return null

  const nextSession: PresentationFlowSession = {
    ...session,
    version: SESSION_VERSION,
    updatedAt: Date.now(),
  }
  storage.setItem(
    getPresentationFlowSessionKey(session.userId, session.articleId),
    JSON.stringify(nextSession)
  )
  return nextSession
}

export function touchPresentationFlowSession(
  userId: number,
  articleId: number,
  storage: Storage | null = getBrowserStorage()
): PresentationFlowSession | null {
  const existing = loadPresentationFlowSession(userId, articleId, storage)
  return savePresentationFlowSession(
    {
      userId,
      articleId,
      generationId: existing?.generationId,
      templateKey: existing?.templateKey,
      templateVersion: existing?.templateVersion,
    },
    storage
  )
}

export function clearPresentationFlowSession(
  userId: number,
  articleId: number,
  storage: Storage | null = getBrowserStorage()
): void {
  storage?.removeItem(getPresentationFlowSessionKey(userId, articleId))
}
