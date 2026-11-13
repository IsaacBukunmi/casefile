import { useOrganization } from '@clerk/react'
import { useEffect } from 'react'
import { useMatters } from '@/api/matters'
import { useMatterListParams } from '@/hooks/useMatterListParams'
import { lastPage } from '@/lib/pagination'
import { ListEmpty, ListError, ListSkeleton } from './matters/ListStates'
import { MatterFilters } from './matters/MatterFilters'
import { MattersFooter } from './matters/MattersFooter'
import { MattersTable } from './matters/MattersTable'

export function MattersPage() {
  const [params, update] = useMatterListParams()
  const matters = useMatters(params)
  // The org's unfiltered count. Same key as the default list, so it's often already cached.
  const orgTotal = useMatters({}).data?.total
  const { organization } = useOrganization()

  const hasFilters = Boolean(params.status ?? params.practice_area ?? params.q)
  const clearFilters = () => {
    update({ status: undefined, practice_area: undefined, q: undefined })
  }

  // A hand-edited ?page= past the end returns no rows; go to the real last page instead.
  const { data, isPlaceholderData } = matters
  useEffect(() => {
    if (!data || isPlaceholderData) return
    if (data.items.length === 0 && data.total > 0) {
      update({ page: lastPage(data.total, data.page_size) }, { replace: true })
    }
  }, [data, isPlaceholderData, update])

  return (
    <div className="mx-auto flex max-w-310 flex-col gap-5 px-8 pt-8 pb-12 motion-safe:animate-screen-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-title font-semibold tracking-tight text-fg-strong">
          Matters
        </h1>
        {orgTotal !== undefined && organization && (
          <p className="text-ui leading-snug text-fg-muted">
            {orgTotal} {orgTotal === 1 ? 'matter' : 'matters'} in {organization.name}
          </p>
        )}
      </div>

      <MatterFilters
        params={params}
        onChange={update}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-2">
        {matters.isPending ? (
          <ListSkeleton />
        ) : matters.isError ? (
          <ListError
            error={matters.error}
            onRetry={() => {
              void matters.refetch()
            }}
          />
        ) : matters.data.total === 0 ? (
          <ListEmpty filtered={hasFilters} orgName={organization?.name} onClear={clearFilters} />
        ) : (
          <>
            <MattersTable
              matters={matters.data.items}
              sort={params.sort ?? 'last_activity'}
              order={params.order ?? 'desc'}
              onSort={(sort, order) => {
                update({ sort, order })
              }}
              busy={matters.isPlaceholderData}
            />
            <MattersFooter
              page={matters.data.page}
              pageSize={matters.data.page_size}
              total={matters.data.total}
              onPage={(page) => {
                update({ page })
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
