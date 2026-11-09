import { ClerkProvider } from '@clerk/react'
import { Outlet, useNavigate } from 'react-router'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error('Set VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env')
}

// ClerkProvider sits inside the router so Clerk navigates with React Router
// instead of reloading the page.
export function RootLayout() {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/matters"
      afterSignOutUrl="/sign-in"
    >
      <Outlet />
    </ClerkProvider>
  )
}
