import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setAuth } from '@/test/clerk'
import { renderApp } from '@/test/render'

describe('ProtectedLayout', () => {
  it('sends signed-out visitors to sign in', async () => {
    setAuth({ isSignedIn: false, userId: null, orgId: null })
    renderApp('/matters')

    expect(await screen.findByText('Redirecting to sign-in')).toBeInTheDocument()
  })

  it('sends a signed-in user without an organization to choose one', async () => {
    setAuth({ orgId: null })
    renderApp('/matters')

    expect(await screen.findByText('Redirecting to choose an organization')).toBeInTheDocument()
  })

  it('renders nothing until Clerk has loaded the session', () => {
    setAuth({ isLoaded: false })
    renderApp('/matters')

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
