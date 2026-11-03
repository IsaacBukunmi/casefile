import { useAuth } from '@clerk/react'
import { useLayoutEffect, type ReactNode } from 'react'
import { setTokenGetter } from '@/api/client'

// Connects the API client to Clerk for everything rendered inside it.
// useLayoutEffect runs before any child's useEffect, so the token getter is in place
// before the first request is sent.
export function ApiAuth({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()

  useLayoutEffect(() => {
    setTokenGetter(() => getToken())
    return () => {
      setTokenGetter(null)
    }
  }, [getToken])

  return children
}
