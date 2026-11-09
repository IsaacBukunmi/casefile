import { ConnectionCheck } from '@/auth/ConnectionCheck'

// Placeholder until Step 7 builds the matters list.
export function MattersPage() {
  return (
    <>
      <h1 className="font-display text-h1 text-fg-strong">Matters</h1>
      <div className="mt-2">
        <ConnectionCheck />
      </div>
    </>
  )
}
