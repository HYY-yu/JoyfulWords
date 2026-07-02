import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveApiBaseUrl } from './config'

test('resolves Hong Kong app host to Hong Kong API host', () => {
  assert.equal(resolveApiBaseUrl('hk.joyword.link'), 'https://hk-api.joyword.link')
})

test('keeps normal JoyfulWords app host on configured API base URL', () => {
  assert.equal(resolveApiBaseUrl('joyword.link'), process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080')
})

test('resolves top-level app host to top-level API host', () => {
  assert.equal(resolveApiBaseUrl('joyword.top'), 'https://api.joyword.top')
})

test('resolves www top-level app host to top-level API host', () => {
  assert.equal(resolveApiBaseUrl('www.joyword.top'), 'https://api.joyword.top')
})

test('keeps localhost on configured API base URL', () => {
  assert.equal(resolveApiBaseUrl('localhost'), process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080')
})
