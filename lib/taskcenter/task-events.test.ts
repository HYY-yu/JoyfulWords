import assert from "node:assert/strict"
import test from "node:test"

import {
  notifyTaskCenterTaskSubmitted,
  subscribeTaskCenterTaskSubmitted,
  type TaskCenterTaskSubmittedDetail,
} from "./task-events"

test("task submission event notifies active subscribers and stops after unsubscribe", () => {
  const previousWindow = globalThis.window
  const eventTarget = new EventTarget()
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: eventTarget,
  })

  try {
    const received: TaskCenterTaskSubmittedDetail[] = []
    const unsubscribe = subscribeTaskCenterTaskSubmitted((detail) => {
      received.push(detail)
    })

    notifyTaskCenterTaskSubmitted({
      type: "echarts",
      taskId: 42,
      articleId: 7,
    })
    unsubscribe()
    notifyTaskCenterTaskSubmitted({
      type: "image",
      taskId: 43,
      articleId: 7,
    })

    assert.deepEqual(received, [
      {
        type: "echarts",
        taskId: 42,
        articleId: 7,
      },
    ])
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: previousWindow,
    })
  }
})
