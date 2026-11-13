import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createQueryClient } from '@/api/queryClient'
import { routes } from '@/routes'

// Renders the whole app at a URL: real routes, layouts, hooks and query client.
// Only the network (MSW) and Clerk (test/clerk.tsx) are fake.
export function renderApp(url: string) {
  const queryClient = createQueryClient()
  // Fail fast: a retried 500 would make every error test wait for the retries.
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  })
  const router = createMemoryRouter(routes, { initialEntries: [url] })

  const user = userEvent.setup()
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...view, user, router, queryClient }
}
