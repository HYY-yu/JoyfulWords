import type { MindMapDocument } from "@/lib/api/articles/types"

type MindMapStore = Map<number, MindMapDocument>

declare global {
  // eslint-disable-next-line no-var
  var __joyfulwordsMindMapStore: MindMapStore | undefined
}

function createStore(): MindMapStore {
  if (!globalThis.__joyfulwordsMindMapStore) {
    globalThis.__joyfulwordsMindMapStore = new Map<number, MindMapDocument>()
  }
  return globalThis.__joyfulwordsMindMapStore
}

export function getMindMap(articleId: number): MindMapDocument | null {
  const store = createStore()
  return store.get(articleId) || null
}

export function upsertMindMap(articleId: number, mindMap: MindMapDocument): MindMapDocument {
  const store = createStore()
  store.set(articleId, mindMap)
  return mindMap
}
