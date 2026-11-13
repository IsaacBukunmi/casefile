import { Navigate, type RouteObject } from 'react-router'
import { AppShell } from '@/app/AppShell'
import { ProtectedLayout } from '@/app/ProtectedLayout'
import { RootLayout } from '@/app/RootLayout'
import { RouteError } from '@/app/RouteError'
import { DocumentPage } from '@/pages/DocumentPage'
import { MatterPage } from '@/pages/MatterPage'
import { MattersPage } from '@/pages/MattersPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SignInPage } from '@/pages/SignInPage'

export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    // Last resort: catches anything that breaks the root itself, so it can't use Clerk.
    ErrorBoundary: RouteError,
    children: [
      // Splat: Clerk's sign-in form has its own steps (/sign-in/factor-one, /sign-in/tasks/...).
      { path: 'sign-in/*', Component: SignInPage },
      {
        Component: ProtectedLayout,
        children: [
          {
            Component: AppShell,
            children: [
              {
                // Pathless route: an error in a page renders here, inside the shell,
                // so the header and navigation stay usable.
                ErrorBoundary: RouteError,
                children: [
                  { index: true, element: <Navigate to="/matters" replace /> },
                  { path: 'matters', Component: MattersPage },
                  { path: 'matters/:matterId', Component: MatterPage },
                  { path: 'documents/:documentId', Component: DocumentPage },
                  { path: '*', Component: NotFoundPage },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
