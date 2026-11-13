import { ChevronLeft, ChevronRight } from 'lucide-react'
import { lastPage } from '@/lib/pagination'

interface MattersFooterProps {
  page: number
  pageSize: number
  total: number
  onPage: (page: number) => void
}

const pageButton =
  'flex size-8 items-center justify-center rounded-sm border border-ink-200 bg-surface-card text-fg-body hover:bg-surface-page disabled:cursor-default disabled:text-ink-300 disabled:hover:bg-surface-card'

export function MattersFooter({ page, pageSize, total, onPage }: MattersFooterProps) {
  const pages = lastPage(total, pageSize)
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-5 py-3 text-small leading-none text-fg-muted">
      <span>
        {first}–{last} of {total} matters
      </span>
      <span className="flex items-center gap-2">
        <span>
          Page {page} of {pages}
        </span>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => {
            onPage(page - 1)
          }}
          className={pageButton}
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => {
            onPage(page + 1)
          }}
          className={pageButton}
        >
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </span>
    </div>
  )
}
