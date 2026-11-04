import { useAuth } from '@clerk/react'
import { useEffect, useState } from 'react'
import { api } from '@/api/client'

type CheckState =
  | { kind: 'loading' }
  | { kind: 'ok'; total: number }
  | { kind: 'error'; message: string; reference: string | null }

// Temporary: proves the token reaches the API and the API scopes data to the active org.
// The real matters screen replaces this in Step 6.
export function ConnectionCheck() {
  const { orgId } = useAuth()
  const [state, setState] = useState<CheckState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    void api.GET('/matters', { params: { query: { page_size: 1 } } }).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setState({ kind: 'error', message: error.message, reference: error.reference })
      } else {
        setState({ kind: 'ok', total: data.total })
      }
    })
    return () => {
      cancelled = true
    }
  }, [orgId])

  return (
    <p role="status" className="text-body text-fg-body">
      {state.kind === 'loading' && 'Checking the API…'}
      {state.kind === 'ok' && `Connected. This organization has ${String(state.total)} matters.`}
      {state.kind === 'error' &&
        `The API said: ${state.message}${state.reference ? ` (${state.reference})` : ''}`}
    </p>
  )
}
