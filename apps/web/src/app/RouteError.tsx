import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { ApiRequestError } from '@/api/errors'

// Rendered by React Router when a route throws while rendering.
export function RouteError() {
  const error = useRouteError()
  // Keep the details in the console for debugging; never show a stack trace to the user.
  console.error(error)

  const title = isRouteErrorResponse(error)
    ? `${String(error.status)} ${error.statusText}`
    : 'Something went wrong'
  const reference = error instanceof ApiRequestError ? error.body?.reference : undefined

  return (
    <div role="alert" className="mx-auto max-w-xl p-8">
      <h1 className="font-display text-h2 text-fg-strong">{title}</h1>
      <p className="mt-2 text-body text-fg-body">
        Try again, or go back to your matters. If it keeps happening, let us know what you were
        doing.
      </p>
      {reference && <p className="mt-2 text-small text-fg-muted">Reference: {reference}</p>}
      <Link to="/matters" className="mt-4 inline-block text-label text-action-primary">
        Back to matters
      </Link>
    </div>
  )
}
