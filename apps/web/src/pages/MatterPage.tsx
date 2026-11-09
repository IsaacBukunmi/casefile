import { useParams } from 'react-router'

// Placeholder until Step 8 builds the matter detail screen.
export function MatterPage() {
  const { matterId } = useParams()

  return <h1 className="font-display text-h1 text-fg-strong">Matter {matterId}</h1>
}
