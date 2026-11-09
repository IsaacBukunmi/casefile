import { SignIn } from '@clerk/react'

export function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      <SignIn path="/sign-in" />
    </main>
  )
}
