import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type {
  MatterListQuery,
  MatterSort,
  MatterStatus,
  PracticeArea,
  SortOrder,
} from '@/api/types'
import { matterStatusLabels, practiceAreaLabels } from '@/lib/labels'

// A Record over the union fails to compile if the API adds a value we haven't listed.
function oneOf<T extends string>(values: Record<T, unknown>) {
  return (value: string): value is T => Object.hasOwn(values, value)
}

// Statuses and practice areas are checked against their label records, the one list of values.
export const isMatterStatus = oneOf<MatterStatus>(matterStatusLabels)
export const isPracticeArea = oneOf<PracticeArea>(practiceAreaLabels)
const isSort = oneOf<MatterSort>({ name: true, client: true, status: true, last_activity: true })
const isOrder = oneOf<SortOrder>({ asc: true, desc: true })

type ListParams = Omit<MatterListQuery, 'page_size'>
export type MatterListChanges = { [K in keyof ListParams]?: ListParams[K] | undefined }

// Anything invalid in the URL is dropped rather than sent, so a hand-edited link can't cause a 422.
// Defaults are dropped too, so /matters and /matters?sort=last_activity share one cache entry.
export function parseMatterListParams(search: URLSearchParams): ListParams {
  const params: ListParams = {}
  const q = search.get('q')?.trim().slice(0, 200)
  if (q) params.q = q
  const status = search.get('status')
  if (status && isMatterStatus(status)) params.status = status
  const practiceArea = search.get('practice_area')
  if (practiceArea && isPracticeArea(practiceArea)) params.practice_area = practiceArea
  const sort = search.get('sort')
  if (sort && isSort(sort) && sort !== 'last_activity') params.sort = sort
  const order = search.get('order')
  if (order && isOrder(order) && order !== 'desc') params.order = order
  const page = Number(search.get('page'))
  if (Number.isInteger(page) && page > 1) params.page = page
  return params
}

function toSearchParams(params: MatterListChanges): URLSearchParams {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(name, String(value))
  }
  return search
}

// The matters list keeps its filters, sort and page in the URL, so they survive a refresh,
// work with the back button, and can be shared as a link.
export function useMatterListParams() {
  const [search, setSearch] = useSearchParams()
  const params = useMemo(() => parseMatterListParams(search), [search])

  const update = useCallback(
    (changes: MatterListChanges, options?: { replace?: boolean }) => {
      setSearch((current) => {
        const next: MatterListChanges = { ...parseMatterListParams(current), ...changes }
        // A new filter or sort changes what's on page 1, so go back to it.
        if (!('page' in changes)) delete next.page
        return toSearchParams(parseMatterListParams(toSearchParams(next)))
      }, options)
    },
    [setSearch],
  )

  return [params, update] as const
}
