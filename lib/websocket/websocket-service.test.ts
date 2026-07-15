import test from "node:test"
import assert from "node:assert/strict"

type WebSocketGlobal = typeof globalThis & {
  WebSocket?: {
    CLOSING: number
    CLOSED: number
  }
}

function installWebSocketReadyStateConstants() {
  const target = globalThis as WebSocketGlobal
  const original = target.WebSocket

  Object.defineProperty(globalThis, "WebSocket", {
    value: {
      CLOSING: 2,
      CLOSED: 3,
    },
    configurable: true,
  })

  return () => {
    Object.defineProperty(globalThis, "WebSocket", {
      value: original,
      configurable: true,
    })
  }
}

test("suppresses expected socket error logs after an established channel is closing", async () => {
  const restore = installWebSocketReadyStateConstants()

  try {
    const { getSocketErrorLogLevel } = await import("./websocket-service")

    assert.equal(
      getSocketErrorLogLevel(
        { hasOpenedOnce: true, manuallyClosed: false, reauthenticating: false },
        3
      ),
      null
    )

    assert.equal(
      getSocketErrorLogLevel(
        { hasOpenedOnce: false, manuallyClosed: true, reauthenticating: false },
        2
      ),
      null
    )
  } finally {
    restore()
  }
})

test("keeps first-connect socket errors visible", async () => {
  const restore = installWebSocketReadyStateConstants()

  try {
    const { getSocketErrorLogLevel } = await import("./websocket-service")

    assert.equal(
      getSocketErrorLogLevel(
        { hasOpenedOnce: false, manuallyClosed: false, reauthenticating: false },
        3
      ),
      "warn"
    )
  } finally {
    restore()
  }
})

test("treats every presentation task message as a TaskCenter refetch signal", async () => {
  const { shouldRefetchPresentationTask, WebSocketMessageType } = await import(
    "./websocket-service"
  )

  for (const messageType of [
    WebSocketMessageType.TASK_UPDATE,
    WebSocketMessageType.TASK_COMPLETE,
    WebSocketMessageType.TASK_FAILED,
  ] as const) {
    assert.equal(
      shouldRefetchPresentationTask({
        connectionKey: "global",
        messageType,
        payload: {
          task_id: 10,
          task_type: "presentation",
          article_id: 123,
          status: "processing",
          outputs: { stage: "generating_pptx" },
        },
      }),
      true
    )
  }
})
