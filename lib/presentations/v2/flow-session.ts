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

export function clearPresentationFlowSession(
  userId: number,
  articleId: number,
  storage: Storage | null = getBrowserStorage()
): void {
  storage?.removeItem(getPresentationFlowSessionKey(userId, articleId))
}

