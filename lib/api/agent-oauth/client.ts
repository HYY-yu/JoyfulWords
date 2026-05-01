import { authenticatedApiRequest } from '@/lib/api/client'
import type { ErrorResponse } from '@/lib/api/types'

export type AgentOAuthStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'consumed'

export interface AgentOAuthAuthorization {
  client_name: string
  device_name: string
  scopes: string[]
  expires_at: string
  status: AgentOAuthStatus
}

export interface AgentOAuthStatusResponse {
  status: AgentOAuthStatus
}

export const agentOAuthClient = {
  getAuthorization(userCode: string) {
    const params = new URLSearchParams({ user_code: userCode })
    return authenticatedApiRequest<AgentOAuthAuthorization | ErrorResponse>(
      `/auth/agent-oauth/authorization?${params.toString()}`
    )
  },

  approveAuthorization(userCode: string) {
    return authenticatedApiRequest<AgentOAuthStatusResponse | ErrorResponse>(
      '/auth/agent-oauth/authorization/approve',
      {
        method: 'POST',
        body: JSON.stringify({ user_code: userCode }),
      }
    )
  },

  denyAuthorization(userCode: string) {
    return authenticatedApiRequest<AgentOAuthStatusResponse | ErrorResponse>(
      '/auth/agent-oauth/authorization/deny',
      {
        method: 'POST',
        body: JSON.stringify({ user_code: userCode }),
      }
    )
  },
}
