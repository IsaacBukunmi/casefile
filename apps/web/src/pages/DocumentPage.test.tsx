import { screen, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { buildApiError, buildClause, maya } from '@/test/fixtures'
import { renderApp } from '@/test/render'
import { http, server } from '@/test/server'

// A response the test releases by hand, so it can check the screen while the request is open.
function deferred() {
  let release: () => void = () => undefined
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

const clause = () => screen.getByRole('listitem')

// Answers the first clause request and holds every refetch open, so whatever the screen
// shows after a failed review comes from the rollback, not from fresh server data.
function holdClauseRefetches() {
  let calls = 0
  server.use(
    http.get('/documents/{document_id}/clauses', async ({ response }) => {
      calls += 1
      if (calls > 1) await new Promise(() => undefined)
      return response(200).json([buildClause()])
    }),
  )
}

describe('DocumentPage reviews', () => {
  it('shows an accepted review before the server answers', async () => {
    const gate = deferred()
    server.use(
      http.put(
        '/documents/{document_id}/clauses/{clause_id}/review',
        async ({ request, response }) => {
          const body = await request.json()
          await gate.promise
          return response(200).json(
            buildClause({
              review: {
                status: body.status,
                note: null,
                reviewed_by: maya,
                reviewed_at: '2026-11-12T10:00:00Z',
              },
            }),
          )
        },
      ),
    )
    const { user } = renderApp('/documents/doc_1')
    await screen.findByText(/unreviewed/)

    await user.click(within(clause()).getByRole('button', { name: 'Accept' }))

    expect(clause()).toHaveTextContent('accepted')
    gate.release()
  })

  it('rolls the clause back and explains why when the server refuses', async () => {
    holdClauseRefetches()
    const gate = deferred()
    server.use(
      http.put('/documents/{document_id}/clauses/{clause_id}/review', async ({ response }) => {
        await gate.promise
        return response(500).json(
          buildApiError({
            code: 'internal_error',
            message: 'Could not save the review.',
            reference: 'CF-9X1A-2B',
          }),
        )
      }),
    )
    const { user } = renderApp('/documents/doc_1')
    await screen.findByText(/unreviewed/)

    await user.click(within(clause()).getByRole('button', { name: 'Accept' }))
    expect(clause()).toHaveTextContent('accepted')

    gate.release()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save the review. (CF-9X1A-2B)',
    )
    expect(clause()).toHaveTextContent('unreviewed')
  })

  it('rolls back when the request never reaches the server', async () => {
    holdClauseRefetches()
    server.use(
      http.put('/documents/{document_id}/clauses/{clause_id}/review', () => HttpResponse.error()),
    )
    const { user } = renderApp('/documents/doc_1')
    await screen.findByText(/unreviewed/)

    await user.click(within(clause()).getByRole('button', { name: 'Accept' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach Casefile.')
    expect(clause()).toHaveTextContent('unreviewed')
  })

  it('says so when a document has no clauses', async () => {
    server.use(
      http.get('/documents/{document_id}/clauses', ({ response }) => response(200).json([])),
    )
    renderApp('/documents/doc_1')

    expect(await screen.findByText('No clauses for this document yet.')).toBeInTheDocument()
  })
})
