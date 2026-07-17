export function shouldResetProductIdentity(
  identifiedUserId: string | null,
  authenticatedUserId: string | null
) {
  return (
    identifiedUserId !== null && identifiedUserId !== authenticatedUserId
  )
}
