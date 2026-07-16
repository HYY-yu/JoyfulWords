import test from "node:test"
import assert from "node:assert/strict"
import {
  clearPresentationFlowSession,
  getPresentationFlowSessionKey,
  loadPresentationFlowSession,
  savePresentationFlowSession,
} from "./flow-session"

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

test("persists and restores a user and article scoped generation", () => {
  const storage = new MemoryStorage()
  savePresentationFlowSession(
    {
      userId: 8,
      articleId: 42,
      generationId: 99,
      templateKey: "node-dsl-example",
      templateVersion: 1,
      imageStyleId: "photo_illustration",
    },
    storage
  )

  const restored = loadPresentationFlowSession(8, 42, storage)
  assert.equal(restored?.generationId, 99)
  assert.equal(restored?.templateKey, "node-dsl-example")
  assert.equal(restored?.imageStyleId, "photo_illustration")

  clearPresentationFlowSession(8, 42, storage)
  assert.equal(storage.getItem(getPresentationFlowSessionKey(8, 42)), null)
})

test("clears invalid or cross-account session data", () => {
  const storage = new MemoryStorage()
  const key = getPresentationFlowSessionKey(8, 42)
  storage.setItem(
    key,
    JSON.stringify({ version: 1, userId: 9, articleId: 42, updatedAt: Date.now() })
  )

  assert.equal(loadPresentationFlowSession(8, 42, storage), null)
  assert.equal(storage.getItem(key), null)
})
