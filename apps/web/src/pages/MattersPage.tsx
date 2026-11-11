import { Link } from 'react-router'
import { useMatters } from '@/api/matters'
import { QueryError } from '@/components/QueryError'
import { isMatterStatus, useMatterListParams } from '@/hooks/useMatterListParams'

// Temporary screen that proves the data layer; Step 7 builds the real list from the design.
export function MattersPage() {
  const [params, setParams] = useMatterListParams()
  const matters = useMatters(params)

  return (
    <>
      <h1 className="font-display text-h1 text-fg-strong">Matters</h1>
      <label className="mt-4 flex items-center gap-2 text-label text-fg-body">
        Status
        <select
          value={params.status ?? ''}
          onChange={(event) => {
            const { value } = event.target
            setParams({ status: isMatterStatus(value) ? value : undefined })
          }}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in_review">In review</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      {matters.isPending && <p className="mt-4 text-body text-fg-muted">Loading matters…</p>}
      {matters.isError && <QueryError error={matters.error} />}
      {matters.data && (
        <>
          <p className="mt-4 text-body text-fg-body">{matters.data.total} matters</p>
          <ul className="mt-2">
            {matters.data.items.map((matter) => (
              <li key={matter.id}>
                <Link to={`/matters/${matter.id}`} className="text-ui text-action-primary">
                  {matter.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
