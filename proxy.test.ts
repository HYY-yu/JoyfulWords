import test from 'node:test'
import assert from 'node:assert/strict'

import { buildProtectedRouteRedirect, config } from '@/proxy'

test('protected route redirect strips Next internal RSC query params', () => {
  assert.equal(
    buildProtectedRouteRedirect(
      '/articles',
      new URLSearchParams('_rsc=1ymmc')
    ),
    '/articles'
  )

  assert.equal(
    buildProtectedRouteRedirect(
      '/articles',
      new URLSearchParams('tab=billing&_rsc=1ymmc')
    ),
    '/articles?tab=billing'
  )
})

test('proxy matcher excludes landing video assets', () => {
  const matcher = config.matcher.join('\n')

  assert.match(matcher, /mp4/)
  assert.match(matcher, /webm/)
})
