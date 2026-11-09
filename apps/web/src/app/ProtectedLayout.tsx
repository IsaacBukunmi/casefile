import { RedirectToSignIn, RedirectToTasks, useAuth } from '@clerk/react'
import { Outlet } from 'react-router'
import { ApiAuth } from '@/auth/ApiAuth'

// Guards every route below it. Only a signed-in user with an active organization gets through;
// the API rejects anything else, so there's no point rendering a screen that will fail.
export function ProtectedLayout() {
  const { isLoaded, isSignedIn, orgId } = useAuth({ treatPendingAsSignedOut: false })

  if (!isLoaded) return null

  // Sends the user to /sign-in with the current URL as redirect_url, so they come back here.
  if (!isSignedIn) return <RedirectToSignIn />

  // Signed in but no organization chosen yet: Clerk's "choose-organization" session task.
  if (!orgId) return <RedirectToTasks />

  return (
    <ApiAuth>
      <Outlet />
    </ApiAuth>
  )
}
