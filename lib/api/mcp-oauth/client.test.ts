import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getMCPOAuthMissingFields,
  readMCPOAuthAuthorizationRequest,
} from '@/lib/api/mcp-oauth/client'

test('reads MCP OAuth authorization query parameters', () => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'joyfulwords-mcp-server',
    redirect_uri: 'http://127.0.0.1:39123/callback',
    scope: 'article.read article.create',
    state: 'state-1',
    code_challenge: 'challenge',
    code_challenge_method: 'S256',
  })

  assert.deepEqual(readMCPOAuthAuthorizationRequest(params), {
    response_type: 'code',
    client_id: 'joyfulwords-mcp-server',
    redirect_uri: 'http://127.0.0.1:39123/callback',
    scope: 'article.read article.create',
    state: 'state-1',
    code_challenge: 'challenge',
    code_challenge_method: 'S256',
  })
})

test('reports missing required MCP OAuth authorization parameters', () => {
  const missing = getMCPOAuthMissingFields(
    readMCPOAuthAuthorizationRequest(new URLSearchParams({ client_id: 'joyfulwords-mcp-server' }))
  )

  assert.deepEqual(missing, [
    'response_type',
    'redirect_uri',
    'code_challenge',
    'code_challenge_method',
  ])
})
