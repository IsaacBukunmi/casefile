import { OrganizationSwitcher, UserButton } from '@clerk/react'
import { NavLink, Outlet } from 'react-router'

// Temporary shell: the real header, navigation and layout are built from the design in Step 7.
export function AppShell() {
  return (
    <div className="min-h-screen bg-surface-page">
      <header className="flex items-center justify-between gap-4 border-b border-border-subtle bg-surface-card px-6 py-3">
        <nav aria-label="Main" className="flex items-center gap-6">
          <span className="font-display text-h3 text-fg-strong">Casefile</span>
          <NavLink
            to="/matters"
            className={({ isActive }) =>
              isActive ? 'text-label text-action-primary' : 'text-label text-fg-body'
            }
          >
            Matters
          </NavLink>
        </nav>
        <div className="flex items-center gap-4">
          {/* An open matter belongs to the old organization, so switching goes back to the list. */}
          <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/matters" />
          <UserButton />
        </div>
      </header>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  )
}
