import { ApiRequestError } from '@/api/errors'

// Shows what went wrong, with the reference the API logged, so a user can quote it to support.
export function QueryError({ error }: { error: Error }) {
  const reference = error instanceof ApiRequestError ? error.body?.reference : undefined

  return (
    <p role="alert" className="mt-4 text-body text-risk-high">
      {error instanceof ApiRequestError ? error.message : 'Could not reach Casefile.'}
      {reference && ` (${reference})`}
    </p>
  )
}
