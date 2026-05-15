import test from 'node:test'
import assert from 'node:assert/strict'

import { buildProtectedRouteRedirect } from '@/proxy'

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
