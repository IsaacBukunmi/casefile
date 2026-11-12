import type { ApiError } from './types'

// Every non-2xx response becomes this error, so TanStack Query treats it as a failed request.
export class ApiRequestError extends Error {
  readonly status: number
  // Null when the body isn't our error envelope, e.g. an HTML 502 page from the host.
  readonly body: ApiError | null

  constructor(status: number, body: ApiError | null) {
    super(body?.message ?? `Request failed with status ${String(status)}`)
    this.name = 'ApiRequestError'
    this.status = status
    this.body = body
  }
}

function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'code' in value && 'reference' in value
}

type ClientResult<T, E> =
  { data: T; error?: never; response: Response } | { data?: never; error: E; response: Response }

// openapi-fetch returns errors instead of throwing them; query functions need them thrown.
// Every endpoint we call returns a JSON body, so a missing body also counts as a failure.
export async function unwrap<T, E>(request: Promise<ClientResult<T, E>>): Promise<T> {
  const result = await request
  if (!result.response.ok || result.data === undefined) {
    throw new ApiRequestError(
      result.response.status,
      isApiError(result.error) ? result.error : null,
    )
  }
  return result.data
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 404
}
