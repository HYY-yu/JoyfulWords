import test from "node:test"
import assert from "node:assert/strict"

import {
  FileConverterApiError,
  convertMarkdownToWord,
  listWordTemplates,
} from "@/lib/api/file-converter/client"
import { tokenStore } from "@/lib/tokens/token-store"

function readFetchUrl(input: string | URL | Request): string {
  return input instanceof Request ? input.url : input.toString()
}

test("guest Markdown conversion uses the guest cookie flow without Authorization", async () => {
  const originalFetch = globalThis.fetch
  tokenStore.clear("file-converter-test")

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(
      readFetchUrl(input),
      "http://localhost:8080/api/document-converter/convert/markdown-to-word"
    )
    assert.equal(init?.method, "POST")
    assert.equal(init?.credentials, "include")

    const headers = new Headers(init?.headers)
    assert.equal(headers.get("Authorization"), null)
    assert.equal(headers.get("Content-Type"), "application/json")
    assert.equal(headers.get("Accept-Language"), "en-US")
    assert.deepEqual(JSON.parse(String(init?.body)), {
      markdown: "# Guest document",
      template_id: "",
    })

    return new Response(
      JSON.stringify({
        task_id: "guest-task",
        status: "succeeded",
        filename: "converted.docx",
        content_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        download_url: "/api/document-converter/tasks/guest-task/download",
        preview_markdown: "# Guest document",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  try {
    const result = await convertMarkdownToWord({ markdown: "# Guest document" })
    assert.equal(result.task_id, "guest-task")
    assert.equal(result.status, "succeeded")
  } finally {
    globalThis.fetch = originalFetch
    tokenStore.clear("file-converter-test")
  }
})

test("guest template listing preserves credentials without forcing login", async () => {
  const originalFetch = globalThis.fetch
  tokenStore.clear("file-converter-test")

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(
      readFetchUrl(input),
      "http://localhost:8080/api/document-converter/templates?type=word"
    )
    assert.equal(init?.credentials, "include")
    assert.equal(new Headers(init?.headers).get("Authorization"), null)

    return new Response(JSON.stringify({ templates: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    assert.deepEqual(await listWordTemplates(), [])
  } finally {
    globalThis.fetch = originalFetch
    tokenStore.clear("file-converter-test")
  }
})

test("guest quota responses preserve the backend login contract", async () => {
  const originalFetch = globalThis.fetch
  tokenStore.clear("file-converter-test")

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: "Today's guest trial quota is used up. Sign in to continue.",
        reason: "guest_global_quota_exceeded",
        action: "login_required",
        feature: "document_conversion",
        limit_type: "global",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    )

  try {
    await assert.rejects(
      () => convertMarkdownToWord({ markdown: "# Quota exhausted" }),
      (error: unknown) =>
        error instanceof FileConverterApiError
        && error.status === 401
        && error.kind === "guest-quota-exceeded"
        && error.reason === "guest_global_quota_exceeded"
        && error.action === "login_required"
        && error.feature === "document_conversion"
        && error.limitType === "global"
    )
  } finally {
    globalThis.fetch = originalFetch
    tokenStore.clear("file-converter-test")
  }
})
