import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clerkMocks } from '@/test/clerk'
import { renderApp } from '@/test/render'
import { http, server } from '@/test/server'

const searchBox = () => screen.getByRole('searchbox', { name: 'Search matters and clients' })
const orgTrigger = () => screen.getByRole('button', { name: /Harlow & Lane/ })
const userTrigger = () => screen.getByRole('button', { name: /Maya Okafor/ })

describe('AppShell', () => {
  describe('organization menu', () => {
    it('lists the user’s organizations and switches to another one', async () => {
      const { user, router } = renderApp('/matters/mat_1')
      await screen.findByRole('heading', { name: 'Acme Ltd – Supplier agreement' })

      await user.click(orgTrigger())
      const menu = screen.getByRole('menu', { name: /Harlow & Lane/ })
      const items = within(menu).getAllByRole('menuitem')
      expect(items.map((item) => item.textContent)).toEqual([
        'HLHarlow & Lane',
        'NGNorthgate Group',
      ])
      expect(items[0]).toHaveAttribute('aria-current', 'true')

      await user.click(within(menu).getByRole('menuitem', { name: /Northgate Group/ }))

      expect(clerkMocks.setActive).toHaveBeenCalledWith({ organization: 'org_northgate' })
      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/matters')
      })
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('shows an error and stays open when switching fails', async () => {
      clerkMocks.setActive.mockRejectedValueOnce(new Error('network'))
      const { user, router } = renderApp('/matters/mat_1')

      await user.click(orgTrigger())
      await user.click(screen.getByRole('menuitem', { name: /Northgate Group/ }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t switch organization')
      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/matters/mat_1')
    })

    it('supports the keyboard: arrows move, Escape closes and returns focus', async () => {
      const { user } = renderApp('/matters')

      orgTrigger().focus()
      await user.keyboard('{Enter}')
      const [first, second] = screen.getAllByRole('menuitem')
      expect(first).toHaveFocus()
      expect(orgTrigger()).toHaveAttribute('aria-expanded', 'true')

      await user.keyboard('{ArrowDown}')
      expect(second).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(first).toHaveFocus()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(orgTrigger()).toHaveFocus()
      expect(orgTrigger()).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes on an outside click, and opening the user menu closes it', async () => {
      const { user } = renderApp('/matters')

      await user.click(orgTrigger())
      await user.click(screen.getByRole('main'))
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()

      await user.click(orgTrigger())
      await user.click(userTrigger())
      expect(screen.getAllByRole('menu')).toHaveLength(1)
      expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
    })
  })

  it('signs out from the user menu', async () => {
    const { user } = renderApp('/matters')

    await user.click(userTrigger())
    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('maya@harlowlane.com')
    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }))

    expect(clerkMocks.signOut).toHaveBeenCalledOnce()
  })

  describe('search', () => {
    it('writes ?q= after a pause and sends it to the API', async () => {
      const queries: (string | null)[] = []
      server.use(
        http.get('/matters', ({ query, response }) => {
          queries.push(query.get('q'))
          return response(200).json({ items: [], total: 0, page: 1, page_size: 10 })
        }),
      )
      const { user, router } = renderApp('/matters')
      await screen.findByText('0 matters')

      await user.type(searchBox(), 'acme')

      await waitFor(() => {
        expect(router.state.location.search).toBe('?q=acme')
      })
      // Replaced, not pushed: the back button skips each keystroke.
      expect(router.state.historyAction).toBe('REPLACE')
      await waitFor(() => {
        expect(queries).toContain('acme')
      })
      // Debounced: no request for the partial words typed on the way.
      expect(queries).not.toContain('a')
    })

    it('goes to the matters list when typing on another page', async () => {
      const { user, router } = renderApp('/matters/mat_1')

      await user.type(searchBox(), 'lumen')

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/matters')
      })
      expect(router.state.location.search).toBe('?q=lumen')
      expect(searchBox()).toHaveValue('lumen')
    })

    it('follows the URL when q changes from outside', async () => {
      const { router } = renderApp('/matters?q=acme')
      expect(searchBox()).toHaveValue('acme')

      await act(() => router.navigate('/matters?q=lumen'))
      expect(searchBox()).toHaveValue('lumen')

      await act(() => router.navigate('/matters'))
      expect(searchBox()).toHaveValue('')
    })

    it('is focused by ⌘K and Ctrl+K', async () => {
      const { user } = renderApp('/matters')

      await user.keyboard('{Meta>}k{/Meta}')
      expect(searchBox()).toHaveFocus()

      searchBox().blur()
      await user.keyboard('{Control>}k{/Control}')
      expect(searchBox()).toHaveFocus()
    })
  })

  it('marks Matters as the current page on the list and on a matter', async () => {
    const { router } = renderApp('/matters')
    const link = () => screen.getByRole('link', { name: 'Matters' })
    expect(link()).toHaveAttribute('aria-current', 'page')

    await act(() => router.navigate('/matters/mat_1'))
    expect(link()).toHaveAttribute('aria-current', 'page')
  })
})
