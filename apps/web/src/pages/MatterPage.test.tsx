import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render'

describe('MatterPage', () => {
  it('shows the matter and links to its documents', async () => {
    renderApp('/matters/mat_1')

    expect(
      await screen.findByRole('heading', { name: 'Acme Ltd – Supplier agreement' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('link', { name: 'Master Services Agreement.pdf' }),
    ).toHaveAttribute('href', '/documents/doc_1')
  })

  // The API answers 404 for another organization's matter too, so this covers shared links.
  it('shows the not-found page when the API answers 404', async () => {
    renderApp('/matters/mat_404')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
