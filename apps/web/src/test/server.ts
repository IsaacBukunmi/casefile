import type { paths } from '@casefile/api-types'
import { setupServer } from 'msw/node'
import { createOpenApiHttp } from 'openapi-msw'
import type { Matter } from '@/api/types'
import { buildApiError, buildClause, buildDocument, buildMatter } from './fixtures'

// Handlers are typed from the OpenAPI schema: a wrong path, parameter or response body
// is a compile error, so the mock API can't drift from the real one.
export const http = createOpenApiHttp<paths>({ baseUrl: import.meta.env.VITE_API_URL })

const matters = [
  buildMatter(),
  buildMatter({ id: 'mat_2', name: 'Northwind – Senior hire contract', status: 'open' }),
  buildMatter({ id: 'mat_3', name: 'Brightwater – Office lease renewal', status: 'closed' }),
]

// Slices a list the way the API pages it: ?page= and ?page_size=, defaulting to 1 and 10.
export function pageOf(
  items: Matter[],
  query: { get: (name: 'page' | 'page_size') => string | null },
) {
  const page = Number(query.get('page') ?? 1)
  const pageSize = Number(query.get('page_size') ?? 10)
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  }
}

// A small, happy-path API. Tests override individual endpoints with server.use(...).
export const handlers = [
  http.get('/matters', ({ query, response }) => {
    const status = query.get('status')
    const area = query.get('practice_area')
    const matching = matters.filter(
      (matter) => (!status || matter.status === status) && (!area || matter.practice_area === area),
    )
    return response(200).json(pageOf(matching, query))
  }),
  http.get('/matters/{matter_id}', ({ params, response }) => {
    const matter = matters.find((m) => m.id === params.matter_id)
    return matter ? response(200).json(matter) : response(404).json(buildApiError())
  }),
  http.get('/matters/{matter_id}/documents', ({ response }) =>
    response(200).json([buildDocument()]),
  ),
  http.get('/documents/{document_id}', ({ response }) => response(200).json(buildDocument())),
  http.get('/documents/{document_id}/clauses', ({ response }) =>
    response(200).json([buildClause()]),
  ),
]

export const server = setupServer(...handlers)
