import { Briefcase, CloudOff, RefreshCw, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiRequestError } from '@/api/errors'

const SKELETON_ROWS = 5

export function ListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading matters" className="flex flex-col">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-border-subtle px-5 py-4 motion-safe:animate-shimmer"
        >
          <span className="h-3 w-2/7 rounded-xs bg-ink-100" />
          <span className="h-3 w-1/6 rounded-xs bg-ink-100" />
          <span className="h-3 w-1/8 rounded-xs bg-ink-100" />
          <span className="h-5 w-1/10 rounded-pill bg-ink-100" />
        </div>
      ))}
    </div>
  )
}

function Message({
  icon,
  tone,
  title,
  children,
}: {
  icon: ReactNode
  tone: 'brand' | 'danger'
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span
        className={`flex size-11 items-center justify-center rounded-lg ${
          tone === 'danger' ? 'bg-risk-high-bg text-risk-high' : 'bg-blue-50 text-action-primary'
        }`}
      >
        {icon}
      </span>
      <h2 className="font-display text-h3 leading-snug font-semibold text-fg-strong">{title}</h2>
      {children}
    </div>
  )
}

export function ListError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const apiError = error instanceof ApiRequestError ? error : null
  const reference = apiError?.body?.reference

  return (
    <div role="alert">
      <Message
        tone="danger"
        icon={<CloudOff aria-hidden="true" className="size-5" />}
        title="Couldn’t load matters"
      >
        <p className="text-small text-fg-muted">
          {apiError ? apiError.message : 'Check your connection and try again.'}
          {reference && <span className="ml-1 font-mono">Ref {reference}</span>}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex h-9 items-center gap-2 rounded-md bg-action-primary px-3 text-ui leading-none font-medium text-fg-on-brand shadow-button hover:bg-action-primary-hover"
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Retry
        </button>
      </Message>
    </div>
  )
}

export function ListEmpty({
  filtered,
  orgName,
  onClear,
}: {
  filtered: boolean
  orgName: string | undefined
  onClear: () => void
}) {
  if (!filtered) {
    return (
      <Message
        tone="brand"
        icon={<Briefcase aria-hidden="true" className="size-5" />}
        title="No matters yet"
      >
        <p className="text-small text-fg-muted">
          Matters in {orgName ?? 'this organization'} will appear here.
        </p>
      </Message>
    )
  }
  return (
    <Message
      tone="brand"
      icon={<SearchX aria-hidden="true" className="size-5" />}
      title="No matters match your filters"
    >
      <p className="text-small text-fg-muted">
        Try a different search, or clear the filters to see everything.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-1 h-9 rounded-md border border-ink-200 bg-surface-card px-3 text-ui leading-none font-medium text-ink-800 hover:bg-surface-page"
      >
        Clear filters
      </button>
    </Message>
  )
}
