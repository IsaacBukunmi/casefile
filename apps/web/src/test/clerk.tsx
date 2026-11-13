import type { ReactNode } from 'react'

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

export function setAuth(changes: Partial<AuthState>) {
  state = { ...state, ...changes }
}

export function resetAuth() {
  state = signedIn
}

export const TEST_TOKEN = 'test-session-token'

// Same function every render, like Clerk's, so ApiAuth's effect doesn't re-run.
const getToken = () => Promise.resolve(state.isSignedIn ? TEST_TOKEN : null)

export function useAuth() {
  return { ...state, getToken }
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return children
}

export const OrganizationSwitcher = () => null
export const UserButton = () => null
export const SignIn = () => <p>Clerk sign-in form</p>
export const RedirectToSignIn = () => <p>Redirecting to sign-in</p>
export const RedirectToTasks = () => <p>Redirecting to choose an organization</p>
