import { RedirectToSignIn, RedirectToTasks, useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { ApiAuth } from '@/auth/ApiAuth'

// Guards every route below it. Only a signed-in user with an active organization gets through;
// the API rejects anything else, so there's no point rendering a screen that will fail.
export function ProtectedLayout() {
  const { isLoaded, isSignedIn, orgId, userId } = useAuth({ treatPendingAsSignedOut: false })
  const queryClient = useQueryClient()

  // On sign-out, drop everything cached, so the next person on this browser can't see it.
  useEffect(() => {
    if (isLoaded && !userId) queryClient.clear()
  }, [isLoaded, userId, queryClient])

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
