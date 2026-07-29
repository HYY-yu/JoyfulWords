import assert from "node:assert/strict"
import test from "node:test"

import {
  DEFAULT_ADAPTIVE_POLLING_POLICY,
  getAdaptivePollingDelay,
} from "./adaptive-polling"

test("uses fast, standard, and slow intervals as a task ages", () => {
  const noJitter = () => 0.5

  assert.equal(
    getAdaptivePollingDelay(
      { elapsedMs: 1000, consecutiveErrors: 0 },
      DEFAULT_ADAPTIVE_POLLING_POLICY,
      noJitter
    ),
    3000
  )
  assert.equal(
    getAdaptivePollingDelay(
      { elapsedMs: 30_000, consecutiveErrors: 0 },
      DEFAULT_ADAPTIVE_POLLING_POLICY,
      noJitter
    ),
    5000
  )
  assert.equal(
    getAdaptivePollingDelay(
      { elapsedMs: 90_000, consecutiveErrors: 0 },
      DEFAULT_ADAPTIVE_POLLING_POLICY,
      noJitter
    ),
    10_000
  )
})

test("backs off repeated errors and caps the interval", () => {
  const noJitter = () => 0.5

  assert.equal(
    getAdaptivePollingDelay(
      { elapsedMs: 1000, consecutiveErrors: 2 },
      DEFAULT_ADAPTIVE_POLLING_POLICY,
      noJitter
    ),
    12_000
  )
  assert.equal(
    getAdaptivePollingDelay(
      { elapsedMs: 1000, consecutiveErrors: 8 },
      DEFAULT_ADAPTIVE_POLLING_POLICY,
      noJitter
    ),
    30_000
  )
})

test("honors a caller-provided interval before applying jitter", () => {
  assert.equal(
    getAdaptivePollingDelay(
      {
        elapsedMs: 1000,
        consecutiveErrors: 0,
        requestedDelayMs: 20_000,
      },
      DEFAULT_ADAPTIVE_POLLING_POLICY,
      () => 0
    ),
    18_000
  )
})
