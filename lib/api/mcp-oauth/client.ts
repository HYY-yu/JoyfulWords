import { authenticatedApiRequest } from '@/lib/api/client'
import type { ErrorResponse } from '@/lib/api/types'

export interface MCPOAuthAuthorizationRequest {
  response_type: string
  client_id: string
  redirect_uri: string
  scope?: string
  state?: string
  code_challenge: string
  code_challenge_method: string
}

export interface MCPOAuthAuthorizationDetail {
  client_id: string
  client_name: string
  redirect_uri: string
  scopes: string[]
  scope: string
  resource_name: string
}

export interface MCPOAuthAuthorizationResult {
  redirect_uri: string
}

export function readMCPOAuthAuthorizationRequest(
  searchParams: Pick<URLSearchParams, 'get'>
): MCPOAuthAuthorizationRequest {
  return {
    response_type: searchParams.get('response_type') ?? '',
    client_id: searchParams.get('client_id') ?? '',
    redirect_uri: searchParams.get('redirect_uri') ?? '',
    scope: searchParams.get('scope') ?? undefined,
    state: searchParams.get('state') ?? undefined,
    code_challenge: searchParams.get('code_challenge') ?? '',
    code_challenge_method: searchParams.get('code_challenge_method') ?? '',
  }
}

export function getMCPOAuthMissingFields(request: MCPOAuthAuthorizationRequest): string[] {
  return [
    ['response_type', request.response_type],
    ['client_id', request.client_id],
    ['redirect_uri', request.redirect_uri],
    ['code_challenge', request.code_challenge],
    ['code_challenge_method', request.code_challenge_method],
  ].flatMap(([field, value]) => value ? [] : [field])
}

function toAuthorizationSearch(request: MCPOAuthAuthorizationRequest): string {
  const params = new URLSearchParams()
  params.set('response_type', request.response_type)
  params.set('client_id', request.client_id)
  params.set('redirect_uri', request.redirect_uri)
  if (request.scope) params.set('scope', request.scope)
  if (request.state) params.set('state', request.state)
  params.set('code_challenge', request.code_challenge)
  params.set('code_challenge_method', request.code_challenge_method)
  return params.toString()
}

export const mcpOAuthClient = {
  getAuthorization(request: MCPOAuthAuthorizationRequest) {
    return authenticatedApiRequest<MCPOAuthAuthorizationDetail | ErrorResponse>(
      `/oauth/authorization?${toAuthorizationSearch(request)}`
    )
  },

  approveAuthorization(request: MCPOAuthAuthorizationRequest) {
    return authenticatedApiRequest<MCPOAuthAuthorizationResult | ErrorResponse>(
      '/oauth/authorization/approve',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  },

  denyAuthorization(request: MCPOAuthAuthorizationRequest) {
    return authenticatedApiRequest<MCPOAuthAuthorizationResult | ErrorResponse>(
      '/oauth/authorization/deny',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  },
}
