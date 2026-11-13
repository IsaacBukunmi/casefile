import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { resetAuth } from './clerk'
import { server } from './server'

// Every test file gets the fake Clerk instead of the real SDK.
vi.mock('@clerk/react', () => import('./clerk'))

// 'error' fails any test that calls an endpoint without a handler, instead of hanging.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetAuth()
})
afterAll(() => {
  server.close()
})
