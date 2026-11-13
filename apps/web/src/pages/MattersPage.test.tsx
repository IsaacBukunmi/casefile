import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Matter } from '@/api/types'
import { TEST_TOKEN } from '@/test/clerk'
import { buildApiError, buildMatter } from '@/test/fixtures'
import { renderApp } from '@/test/render'
import { http, pageOf, server } from '@/test/server'

const table = () => screen.getByRole('table', { name: 'Matters' })
const bodyRows = () => within(table()).getAllByRole('row').slice(1)
const header = (name: string) => screen.getByRole('columnheader', { name })

// Records the query string of every /matters request, and answers from `items`.
function recordRequests(items: Matter[] = [buildMatter()]) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get('/matters', ({ request, query, response }) => {
      requests.push(new URL(request.url).searchParams)
      return response(200).json(pageOf(items, query))
    }),
  )
  return requests
}

const twelveMatters = Array.from({ length: 12 }, (_, index) =>
  buildMatter({ id: `mat_${String(index + 1)}`, name: `Matter ${String(index + 1)}` }),
)

afterEach(() => {
  vi.useRealTimers()
})

describe('MattersPage', () => {
  it("lists the organization's matters with links, badges and owners", async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'))
    renderApp('/matters')

    expect(await screen.findByText('3 matters in Harlow & Lane')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Acme Ltd – Supplier agreement' })
    expect(link).toHaveAttribute('href', '/matters/mat_1')
    const acme = bodyRows()[0]
    expect(acme).toBeDefined()
    if (!acme) return
    const row = within(acme)
    expect(row.getByText('In review')).toBeInTheDocument()
    expect(row.getByText('Commercial')).toBeInTheDocument()
    expect(row.getByText('3 h ago')).toHaveAttribute('datetime', '2026-11-01T09:00:00Z')
    expect(row.getByText('Maya O.')).toBeInTheDocument()
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

    expect(await screen.findByText('No matters yet')).toBeInTheDocument()
    expect(authorization).toEqual([`Bearer ${TEST_TOKEN}`])
  })

  describe('filters', () => {
    it('keeps the status in the URL and sends it to the API', async () => {
      const requests = recordRequests()
      const { user, router } = renderApp('/matters')
      await screen.findByRole('table', { name: 'Matters' })

      const status = screen.getByRole('group', { name: 'Status' })
      await user.click(within(status).getByRole('button', { name: 'Open' }))

      expect(router.state.location.search).toBe('?status=open')
      expect(within(status).getByRole('button', { name: 'Open' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(within(status).getByRole('button', { name: 'All' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
      await waitFor(() => {
        expect(requests.at(-1)?.get('status')).toBe('open')
      })
    })

    it('reads the status from a shared link', async () => {
      renderApp('/matters?status=closed')

      expect(await screen.findByRole('link', { name: /Brightwater/ })).toBeInTheDocument()
      expect(bodyRows()).toHaveLength(1)
      expect(screen.getByRole('button', { name: 'Closed' })).toHaveAttribute('aria-pressed', 'true')
      // The subtitle is the org's unfiltered total, not the filtered count.
      expect(screen.getByText('3 matters in Harlow & Lane')).toBeInTheDocument()
    })

    it('keeps the practice area in the URL and sends it to the API', async () => {
      const requests = recordRequests()
      const { user, router } = renderApp('/matters')
      await screen.findByRole('table', { name: 'Matters' })

      await user.selectOptions(screen.getByRole('combobox', { name: 'Practice area' }), 'privacy')

      expect(router.state.location.search).toBe('?practice_area=privacy')
      await waitFor(() => {
        expect(requests.at(-1)?.get('practice_area')).toBe('privacy')
      })
      expect(screen.getByRole('combobox', { name: 'Practice area' })).toHaveValue('privacy')
    })

    it('never sends invalid filters from a hand-edited URL', async () => {
      const requests = recordRequests([])
      renderApp('/matters?status=bogus&practice_area=sports&page=-1')

      expect(await screen.findByText('No matters yet')).toBeInTheDocument()
      expect(requests.map(String)).toEqual([''])
    })

    it('clears status, practice area and search but keeps the sort', async () => {
      const { user, router } = renderApp(
        '/matters?status=open&practice_area=privacy&q=acme&sort=name',
      )
      await screen.findByText('3 matters in Harlow & Lane')

      // The filter row's button; the empty state below has its own.
      const [inFilterRow] = screen.getAllByRole('button', { name: 'Clear filters' })
      expect(inFilterRow).toBeDefined()
      if (!inFilterRow) return
      await user.click(inFilterRow)

      expect(router.state.location.search).toBe('?sort=name')
      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    })

    it('hides Clear filters when nothing is filtered', async () => {
      renderApp('/matters?sort=name')
      await screen.findByRole('table', { name: 'Matters' })

      expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('starts on Last activity, newest first; other columns start ascending', async () => {
      const requests = recordRequests()
      const { user, router } = renderApp('/matters')
      await screen.findByRole('table', { name: 'Matters' })
      expect(header('Last activity')).toHaveAttribute('aria-sort', 'descending')
      expect(header('Matter')).toHaveAttribute('aria-sort', 'none')

      await user.click(within(header('Matter')).getByRole('button'))
      expect(header('Matter')).toHaveAttribute('aria-sort', 'ascending')
      expect(header('Last activity')).toHaveAttribute('aria-sort', 'none')
      expect(router.state.location.search).toBe('?sort=name&order=asc')
      await waitFor(() => {
        expect(requests.at(-1)?.toString()).toBe('sort=name&order=asc')
      })

      // Descending is the API's default order, so the URL and the request leave it out.
      await user.click(within(header('Matter')).getByRole('button'))
      expect(header('Matter')).toHaveAttribute('aria-sort', 'descending')
      expect(router.state.location.search).toBe('?sort=name')
      await waitFor(() => {
        expect(requests.at(-1)?.toString()).toBe('sort=name')
      })

      await user.click(within(header('Client')).getByRole('button'))
      expect(header('Client')).toHaveAttribute('aria-sort', 'ascending')

      // Coming back to Last activity starts newest first, which is also the default URL.
      await user.click(within(header('Last activity')).getByRole('button'))
      expect(header('Last activity')).toHaveAttribute('aria-sort', 'descending')
      expect(router.state.location.search).toBe('')
    })

    it('flips Last activity to oldest first, and back to the default', async () => {
      const { user, router } = renderApp('/matters')
      await screen.findByRole('table', { name: 'Matters' })

      await user.click(within(header('Last activity')).getByRole('button'))
      expect(router.state.location.search).toBe('?order=asc')
      expect(header('Last activity')).toHaveAttribute('aria-sort', 'ascending')

      await user.click(within(header('Last activity')).getByRole('button'))
      expect(router.state.location.search).toBe('')
    })

    it('only offers the columns the API can sort by', async () => {
      renderApp('/matters')
      await screen.findByRole('table', { name: 'Matters' })

      for (const name of ['Practice area', 'Docs', 'Owner']) {
        expect(header(name)).not.toHaveAttribute('aria-sort')
        expect(within(header(name)).queryByRole('button')).not.toBeInTheDocument()
      }
    })
  })

  describe('pagination', () => {
    it('pages through the results', async () => {
      recordRequests(twelveMatters)
      const { user, router } = renderApp('/matters')
      expect(await screen.findByText('1–10 of 12 matters')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Next page' }))

      expect(router.state.location.search).toBe('?page=2')
      expect(await screen.findByText('11–12 of 12 matters')).toBeInTheDocument()
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
      expect(bodyRows()).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled()
    })

    it('keeps the current rows, marked busy, while the next page loads', async () => {
      let releasePage2: () => void = () => undefined
      const page2Loaded = new Promise<void>((resolve) => {
        releasePage2 = resolve
      })
      server.use(
        http.get('/matters', async ({ query, response }) => {
          if (query.get('page') === '2') await page2Loaded
          return response(200).json(pageOf(twelveMatters, query))
        }),
      )
      const { user } = renderApp('/matters')
      await screen.findByText('1–10 of 12 matters')
      expect(table()).toHaveAttribute('aria-busy', 'false')

      await user.click(screen.getByRole('button', { name: 'Next page' }))

      expect(table()).toHaveAttribute('aria-busy', 'true')
      expect(bodyRows()).toHaveLength(10)
      releasePage2()
      expect(await screen.findByText('11–12 of 12 matters')).toBeInTheDocument()
      expect(table()).toHaveAttribute('aria-busy', 'false')
    })

    it('replaces a page past the end with the last page', async () => {
      recordRequests(twelveMatters)
      const { router } = renderApp('/matters?page=5')

      await waitFor(() => {
        expect(router.state.location.search).toBe('?page=2')
      })
      expect(router.state.historyAction).toBe('REPLACE')
      expect(await screen.findByText('11–12 of 12 matters')).toBeInTheDocument()
    })
  })

  describe('states', () => {
    it('shows five skeleton rows while the first page loads', async () => {
      let release: () => void = () => undefined
      const loaded = new Promise<void>((resolve) => {
        release = resolve
      })
      server.use(
        http.get('/matters', async ({ query, response }) => {
          await loaded
          return response(200).json(pageOf([buildMatter()], query))
        }),
      )
      renderApp('/matters')

      const loading = await screen.findByRole('status', { name: 'Loading matters' })
      expect(loading).toHaveAttribute('aria-busy', 'true')
      expect(loading.children).toHaveLength(5)
      release()
      expect(await screen.findByRole('table', { name: 'Matters' })).toBeInTheDocument()
      expect(screen.queryByRole('status', { name: 'Loading matters' })).not.toBeInTheDocument()
    })

    it('says when no matters match the filters, and clears them', async () => {
      const { user, router } = renderApp('/matters?practice_area=privacy')

      expect(await screen.findByText('No matters match your filters')).toBeInTheDocument()
      const clearButtons = screen.getAllByRole('button', { name: 'Clear filters' })
      const inEmptyState = clearButtons.at(-1)
      expect(inEmptyState).toBeDefined()
      if (!inEmptyState) return
      await user.click(inEmptyState)

      expect(router.state.location.search).toBe('')
      expect(await screen.findByRole('table', { name: 'Matters' })).toBeInTheDocument()
    })

    it('says when the organization has no matters at all', async () => {
      recordRequests([])
      renderApp('/matters')

      expect(await screen.findByText('No matters yet')).toBeInTheDocument()
      expect(screen.getByText('Matters in Harlow & Lane will appear here.')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('shows the API message and reference, and retries', async () => {
      let calls = 0
      server.use(
        http.get('/matters', ({ query, response }) => {
          calls += 1
          if (calls === 1) {
            return response(500).json(
              buildApiError({
                code: 'internal_error',
                message: 'Something went wrong on our side.',
                reference: 'CF-7Q2M-4K',
              }),
            )
          }
          return response(200).json(pageOf([buildMatter()], query))
        }),
      )
      const { user } = renderApp('/matters')

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('Couldn’t load matters')
      expect(alert).toHaveTextContent('Something went wrong on our side.')
      expect(alert).toHaveTextContent('Ref CF-7Q2M-4K')

      await user.click(within(alert).getByRole('button', { name: 'Retry' }))

      expect(await screen.findByRole('table', { name: 'Matters' })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('opening a matter', () => {
    it('opens from the name link', async () => {
      const { user, router } = renderApp('/matters')

      await user.click(await screen.findByRole('link', { name: 'Acme Ltd – Supplier agreement' }))

      expect(router.state.location.pathname).toBe('/matters/mat_1')
    })

    it('opens from anywhere on the row', async () => {
      const { user, router } = renderApp('/matters')
      await screen.findByRole('table', { name: 'Matters' })
      const acme = bodyRows()[0]
      expect(acme).toBeDefined()
      if (!acme) return

      await user.click(within(acme).getByText('Acme Ltd'))

      expect(router.state.location.pathname).toBe('/matters/mat_1')
    })
  })
})
