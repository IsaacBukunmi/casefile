import { Lock } from 'lucide-react'
import type { MatterStatus } from '@/api/types'
import { matterStatusLabels } from '@/lib/labels'

const tone: Record<MatterStatus, string> = {
  open: 'border-blue-200 bg-blue-50 text-blue-700',
  in_review: 'border-risk-med-border bg-risk-med-bg text-risk-med',
  closed: 'border-ink-200 bg-surface-page text-ink-600',
}

// Each status has its own shape (dot, ring, lock) as well as a label, so it never relies on
// colour alone.
function Marker({ status }: { status: MatterStatus }) {
  switch (status) {
    case 'open':
      return <span aria-hidden="true" className="size-1.5 rounded-pill bg-current" />
    case 'in_review':
      return <span aria-hidden="true" className="size-1.5 rounded-pill border border-current" />
    case 'closed':
      return <Lock aria-hidden="true" className="size-2.75" />
  }
}

export function StatusBadge({ status }: { status: MatterStatus }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-pill border px-2 text-caption leading-none font-medium whitespace-nowrap ${tone[status]}`}
    >
      <Marker status={status} />
      {matterStatusLabels[status]}
    </span>
  )
}
