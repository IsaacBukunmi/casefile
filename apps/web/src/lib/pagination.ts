// The number of the last page; an empty list still has a page 1.
export function lastPage(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
