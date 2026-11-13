import type { ReactNode } from 'react'
import { vi } from 'vitest'

// Stands in for @clerk/react in every test (see setup.ts). Tests change the signed-in state
// with setAuth; Clerk's UI components render as plain markers.
interface AuthState {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string | null
  orgId: string | null
}

const signedIn: AuthState = {
  isLoaded: true,
  isSignedIn: true,
  userId: 'usr_maya',
  orgId: 'org_harlow',
}

let state: AuthState = signedIn

// The signed-in user's organizations, matching the API seed.
export const ORGANIZATIONS = [
  { id: 'org_harlow', name: 'Harlow & Lane', membersCount: 4 },
  { id: 'org_northgate', name: 'Northgate Group', membersCount: 2 },
]

export const USER = {
  id: 'usr_maya',
  firstName: 'Maya',
  lastName: 'Okafor',
  fullName: 'Maya Okafor',
  primaryEmailAddress: { emailAddress: 'maya@harlowlane.com' },
}

// Spies for Clerk actions. setActive switches the active org, like the real one.
export const clerkMocks = {
  setActive: vi.fn((params: { organization: string }) => {
    state = { ...state, orgId: params.organization }
    return Promise.resolve()
  }),
  signOut: vi.fn(() => Promise.resolve()),
}

export function setAuth(changes: Partial<AuthState>) {
  state = { ...state, ...changes }
}

export function resetAuth() {
  state = signedIn
  clerkMocks.setActive.mockClear()
  clerkMocks.signOut.mockClear()
}

export const TEST_TOKEN = 'test-session-token'

// Same function every render, like Clerk's, so ApiAuth's effect doesn't re-run.
const getToken = () => Promise.resolve(state.isSignedIn ? TEST_TOKEN : null)

export function useAuth() {
  return { ...state, getToken }
}

export function useOrganization() {
  const organization = ORGANIZATIONS.find((org) => org.id === state.orgId) ?? null
  return { isLoaded: state.isLoaded, organization }
}

export function useOrganizationList() {
  return {
    isLoaded: state.isLoaded,
    setActive: clerkMocks.setActive,
    userMemberships: {
      isLoading: !state.isLoaded,
      data: ORGANIZATIONS.map((organization) => ({ id: `mem_${organization.id}`, organization })),
    },
  }
}

export function useUser() {
  return { isLoaded: state.isLoaded, user: state.isSignedIn ? USER : null }
}

export function useClerk() {
  return { signOut: clerkMocks.signOut }
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return children
}

export const SignIn = () => <p>Clerk sign-in form</p>
export const RedirectToSignIn = () => <p>Redirecting to sign-in</p>
export const RedirectToTasks = () => <p>Redirecting to choose an organization</p>
