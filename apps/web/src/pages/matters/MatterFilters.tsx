import { ChevronDown } from 'lucide-react'
import type { MatterListQuery, MatterStatus } from '@/api/types'
import { isPracticeArea, type MatterListChanges } from '@/hooks/useMatterListParams'
import {
  MATTER_STATUSES,
  matterStatusLabels,
  PRACTICE_AREAS,
  practiceAreaLabels,
} from '@/lib/labels'

interface MatterFiltersProps {
  params: MatterListQuery
  onChange: (changes: MatterListChanges) => void
  hasFilters: boolean
  onClear: () => void
}

const chips: { label: string; status: MatterStatus | undefined }[] = [
  { label: 'All', status: undefined },
  ...MATTER_STATUSES.map((status) => ({ label: matterStatusLabels[status], status })),
]

export function MatterFilters({ params, onChange, hasFilters, onClear }: MatterFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Status" className="flex flex-wrap gap-1">
        {chips.map(({ label, status }) => {
          const pressed = params.status === status
          return (
            <button
              key={label}
              type="button"
              aria-pressed={pressed}
              onClick={() => {
                onChange({ status })
              }}
              className={`h-8 rounded-pill border px-3 text-small leading-none font-medium ${
                pressed
                  ? 'border-ink-900 bg-ink-900 text-fg-on-brand'
                  : 'border-ink-200 bg-surface-card text-fg-body hover:bg-surface-page'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="relative flex items-center">
        <select
          aria-label="Practice area"
          value={params.practice_area ?? ''}
          onChange={(event) => {
            const { value } = event.target
            onChange({ practice_area: isPracticeArea(value) ? value : undefined })
          }}
          className="h-8 cursor-pointer appearance-none rounded-pill border border-ink-200 bg-surface-card pr-8 pl-3 text-small leading-none font-medium text-fg-body"
        >
          <option value="">All practice areas</option>
          {PRACTICE_AREAS.map((area) => (
            <option key={area} value={area}>
              {practiceAreaLabels[area]}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 size-3.25 text-fg-muted"
        />
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="h-8 px-2 text-small leading-none font-medium text-action-primary hover:text-action-primary-hover"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
