import assert from "node:assert/strict"
import test from "node:test"
import { shouldResetProductIdentity } from "./identity"

test("does not reset a new anonymous visitor", () => {
  assert.equal(shouldResetProductIdentity(null, null), false)
})

test("does not reset when PostHog already identifies the authenticated user", () => {
  assert.equal(shouldResetProductIdentity("42", "42"), false)
})

test("resets when an identified user signs out", () => {
  assert.equal(shouldResetProductIdentity("42", null), true)
})

test("resets before identifying a different account", () => {
  assert.equal(shouldResetProductIdentity("42", "84"), true)
})
