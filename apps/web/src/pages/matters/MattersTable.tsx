import { ArrowDown, ArrowUp } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { Matter, MatterSort, SortOrder } from '@/api/types'
import { PersonAvatar } from '@/components/PersonAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import { useNow } from '@/hooks/useNow'
import { formatRelative } from '@/lib/formatRelative'
import { practiceAreaLabels } from '@/lib/labels'
import { shortName } from '@/lib/people'

interface MattersTableProps {
  matters: Matter[]
  sort: MatterSort
  order: SortOrder
  onSort: (sort: MatterSort, order: SortOrder) => void
  busy: boolean
}

// Only these columns can be sorted: the API sorts by name, client, status and last activity.
const columns: { label: string; sort?: MatterSort; className?: string }[] = [
  { label: 'Matter', sort: 'name', className: 'min-w-55' },
  { label: 'Client', sort: 'client' },
  { label: 'Practice area' },
  { label: 'Status', sort: 'status' },
  { label: 'Docs', className: 'w-16' },
  { label: 'Last activity', sort: 'last_activity' },
  { label: 'Owner' },
]

// A new column starts ascending, except Last activity, where newest first is the useful start.
function initialOrder(sort: MatterSort): SortOrder {
  return sort === 'last_activity' ? 'desc' : 'asc'
}

const cell = 'px-3 first:pl-5 last:pr-5'

export function MattersTable({ matters, sort, order, onSort, busy }: MattersTableProps) {
  const navigate = useNavigate()
  const now = useNow()

  return (
    <div className="overflow-x-auto">
      <table
        aria-label="Matters"
        aria-busy={busy}
        className="w-full min-w-225 border-collapse text-left aria-busy:opacity-60"
      >
        <thead className="border-b border-border-subtle bg-surface-sunken">
          <tr>
            {columns.map((column) => {
              const active = column.sort === sort
              const ariaSort = column.sort
                ? active
                  ? order === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : undefined
              return (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`h-10 text-caption leading-none font-medium ${cell} ${column.className ?? ''} ${
                    active ? 'text-fg-strong' : 'text-fg-muted'
                  }`}
                >
                  {column.sort ? (
                    <button
                      type="button"
                      onClick={() => {
                        const target = column.sort ?? sort
                        onSort(
                          target,
                          active ? (order === 'asc' ? 'desc' : 'asc') : initialOrder(target),
                        )
                      }}
                      className="flex items-center gap-1 rounded-xs hover:text-fg-strong"
                    >
                      {column.label}
                      {active &&
                        (order === 'asc' ? (
                          <ArrowUp aria-hidden="true" className="size-3" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="size-3" />
                        ))}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {matters.map((matter) => {
            const lastActivity = new Date(matter.last_activity_at)
            return (
              // The name link is the keyboard and screen-reader path to a matter; clicking
              // anywhere else on the row is a pointer shortcut to the same place.
              <tr
                key={matter.id}
                onClick={(event) => {
                  if (event.target instanceof Element && event.target.closest('a')) return
                  void navigate(`/matters/${matter.id}`)
                }}
                className="cursor-pointer border-b border-border-subtle text-ui leading-snug text-fg-body last:border-b-0 hover:bg-surface-sunken"
              >
                <td className={`py-3 ${cell}`}>
                  <Link
                    to={`/matters/${matter.id}`}
                    className="rounded-xs font-medium text-fg-strong hover:underline"
                  >
                    {matter.name}
                  </Link>
                </td>
                <td className={`py-3 ${cell}`}>{matter.client}</td>
                <td className={`py-3 ${cell}`}>{practiceAreaLabels[matter.practice_area]}</td>
                <td className={`py-3 ${cell}`}>
                  <StatusBadge status={matter.status} />
                </td>
                <td className={`py-3 font-mono text-small leading-none font-medium ${cell}`}>
                  {matter.document_count}
                </td>
                <td className={`py-3 text-fg-muted ${cell}`}>
                  <time
                    dateTime={matter.last_activity_at}
                    title={lastActivity.toLocaleString('en-GB')}
                  >
                    {formatRelative(lastActivity, now)}
                  </time>
                </td>
                <td className={`py-3 ${cell}`}>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <PersonAvatar person={matter.owner} />
                    {shortName(matter.owner.name)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
