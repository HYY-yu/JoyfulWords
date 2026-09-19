import test from "node:test"
import assert from "node:assert/strict"
import {
  clearPresentationFlowSession,
  findLatestPresentationFlowSession,
  getPresentationFlowSessionKey,
  loadPresentationFlowSession,
  savePresentationFlowSession,
  touchPresentationFlowSession,
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
    },
    storage
  )

  const restored = loadPresentationFlowSession(8, 42, storage)
  assert.equal(restored?.generationId, 99)
  assert.equal(restored?.templateKey, "node-dsl-example")

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

test("restores the most recently updated generation for a user", () => {
  const storage = new MemoryStorage()
  savePresentationFlowSession(
    { userId: 8, articleId: 41, generationId: 98 },
    storage
  )
  storage.setItem(
    getPresentationFlowSessionKey(8, 42),
    JSON.stringify({
      version: 1,
      userId: 8,
      articleId: 42,
      generationId: 99,
      updatedAt: Date.now() + 1_000,
    })
  )
  savePresentationFlowSession(
    { userId: 8, articleId: 43 },
    storage
  )
  savePresentationFlowSession(
    { userId: 9, articleId: 44, generationId: 100 },
    storage
  )

  const restored = findLatestPresentationFlowSession(8, storage)
  assert.equal(restored?.articleId, 42)
  assert.equal(restored?.generationId, 99)
})

test("touches a flow without losing its resumable generation metadata", () => {
  const storage = new MemoryStorage()
  savePresentationFlowSession(
    {
      userId: 8,
      articleId: 42,
      generationId: 99,
      templateKey: "node-dsl-example",
      templateVersion: 1,
    },
    storage
  )

  const touched = touchPresentationFlowSession(8, 42, storage)
  assert.equal(touched?.generationId, 99)
  assert.equal(touched?.templateKey, "node-dsl-example")

  const newFlow = touchPresentationFlowSession(8, 43, storage)
  assert.equal(newFlow?.articleId, 43)
  assert.equal(newFlow?.generationId, undefined)
  assert.equal(findLatestPresentationFlowSession(8, storage)?.articleId, 43)
})
