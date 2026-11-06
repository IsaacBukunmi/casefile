import { OrganizationSwitcher, Show, UserButton } from '@clerk/react'
import { ApiAuth } from '@/auth/ApiAuth'
import { ConnectionCheck } from '@/auth/ConnectionCheck'
import { SignedOutScreen } from '@/auth/SignedOutScreen'

export default function App() {
  return (
    <Show when="signed-in" fallback={<SignedOutScreen />}>
      <ApiAuth>
        <main className="min-h-screen bg-surface-page p-[13px]">
          <header className="flex items-center justify-between gap-4">
            <OrganizationSwitcher hidePersonal />
            <UserButton />
          </header>
          <h1 className="mt-8 font-display text-h1 text-fg-strong">Casefile</h1>
          <div className="mt-2">
            <ConnectionCheck />
          </div>
        </main>
      </ApiAuth>
    </Show>
  )
}
