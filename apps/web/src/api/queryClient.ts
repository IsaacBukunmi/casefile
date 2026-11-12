import { QueryClient } from '@tanstack/react-query'
import { ApiRequestError } from './errors'

// A 4xx won't change on a retry; a dropped connection or a 5xx might.
function isRetryable(error: Error): boolean {
  return !(error instanceof ApiRequestError) || error.status >= 500
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      },
    },
  })
}
