import { useAuth } from '@clerk/react'

// ProtectedLayout only renders its children once there's an active org, so this always has one.
export function useOrgId(): string {
  const { orgId } = useAuth()
  if (!orgId) {
    throw new Error('useOrgId must be used inside ProtectedLayout')
  }
  return orgId
}
