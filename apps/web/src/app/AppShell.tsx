import { Outlet } from 'react-router'
import { SearchBar } from './shell/SearchBar'
import { Sidebar } from './shell/Sidebar'

// The signed-in layout from the design's APP SHELL: sidebar, top bar with search, and the
// scrolling main area each page renders into. Desktop only for now (mobile is Step 10).
export function AppShell() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-15 flex-none items-center gap-3 border-b border-border-subtle bg-surface-card pr-4 pl-5">
          <SearchBar />
        </header>
        <main className="relative min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
