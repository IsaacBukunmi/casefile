import { SignIn, TaskChooseOrganization, useAuth } from '@clerk/react'

// Shown to anyone who isn't fully signed in. A "pending" user has signed in but not chosen
// an organization yet, so they get Clerk's organization picker instead of the sign-in form.
export function SignedOutScreen() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })

  if (!isLoaded) return null

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      {isSignedIn ? <TaskChooseOrganization redirectUrlComplete="/" /> : <SignIn />}
    </main>
  )
}
