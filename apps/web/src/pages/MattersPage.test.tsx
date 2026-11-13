import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TEST_TOKEN } from '@/test/clerk'
import { buildApiError } from '@/test/fixtures'
import { renderApp } from '@/test/render'
import { http, server } from '@/test/server'

describe('MattersPage', () => {
  it("lists the organization's matters", async () => {
    renderApp('/matters')

    expect(await screen.findByText('3 matters')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Acme Ltd – Supplier agreement' })).toHaveAttribute(
      'href',
      '/matters/mat_1',
    )
  })

  it('sends the Clerk session token with every request', async () => {
    const authorization: (string | null)[] = []
    server.use(
      http.get('/matters', ({ request, response }) => {
        authorization.push(request.headers.get('Authorization'))
        return response(200).json({ items: [], total: 0, page: 1, page_size: 10 })
      }),
    )
    renderApp('/matters')

    expect(await screen.findByText('0 matters')).toBeInTheDocument()
    expect(authorization).toEqual([`Bearer ${TEST_TOKEN}`])
  })

  it('keeps the status filter in the URL and sends it to the API', async () => {
    const { user, router } = renderApp('/matters')
    await screen.findByText('3 matters')

    await user.selectOptions(screen.getByLabelText('Status'), 'open')

    expect(await screen.findByText('1 matters')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?status=open')
  })

  it('reads the filter from a shared link', async () => {
    renderApp('/matters?status=closed')

    expect(await screen.findByText('1 matters')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveValue('closed')
  })

  it('never sends invalid filters from a hand-edited URL', async () => {
    const queries: string[] = []
    server.use(
      http.get('/matters', ({ request, response }) => {
        queries.push(new URL(request.url).search)
        return response(200).json({ items: [], total: 0, page: 1, page_size: 10 })
      }),
    )
    renderApp('/matters?status=bogus&page=-1')

    expect(await screen.findByText('0 matters')).toBeInTheDocument()
    expect(queries).toEqual([''])
  })

  it('shows the API message and reference when the request fails', async () => {
    server.use(
      http.get('/matters', ({ response }) =>
        response(500).json(
          buildApiError({
            code: 'internal_error',
            message: 'Something went wrong on our side.',
            reference: 'CF-7Q2M-4K',
          }),
        ),
      ),
    )
    renderApp('/matters')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong on our side. (CF-7Q2M-4K)',
    )
  })
})
