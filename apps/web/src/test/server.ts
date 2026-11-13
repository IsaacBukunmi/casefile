import type { paths } from '@casefile/api-types'
import { setupServer } from 'msw/node'
import { createOpenApiHttp } from 'openapi-msw'
import { buildApiError, buildClause, buildDocument, buildMatter } from './fixtures'

// Handlers are typed from the OpenAPI schema: a wrong path, parameter or response body
// is a compile error, so the mock API can't drift from the real one.
export const http = createOpenApiHttp<paths>({ baseUrl: import.meta.env.VITE_API_URL })

const matters = [
  buildMatter(),
  buildMatter({ id: 'mat_2', name: 'Northwind – Senior hire contract', status: 'open' }),
  buildMatter({ id: 'mat_3', name: 'Brightwater – Office lease renewal', status: 'closed' }),
]

// A small, happy-path API. Tests override individual endpoints with server.use(...).
export const handlers = [
  http.get('/matters', ({ query, response }) => {
    const status = query.get('status')
    const items = status ? matters.filter((matter) => matter.status === status) : matters
    return response(200).json({ items, total: items.length, page: 1, page_size: 10 })
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
