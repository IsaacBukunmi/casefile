import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useMatterListParams } from '@/hooks/useMatterListParams'

const DEBOUNCE_MS = 250

// Global search for the matters list. The input keeps its own value so typing stays instant;
// the URL's ?q= is written shortly after the user stops typing.
export function SearchBar() {
  const [params, update] = useMatterListParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Only the matters list has a search; anywhere else the box starts empty.
  const onList = pathname === '/matters'
  const urlQ = onList ? (params.q ?? '') : ''

  // When the URL's q changes from outside (back button, Clear filters, another page),
  // the input follows. Adjusting state during render avoids a stale frame from an effect.
  const [value, setValue] = useState(urlQ)
  const [syncedQ, setSyncedQ] = useState(urlQ)
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ)
    if (value.trim() !== urlQ) setValue(urlQ)
  }

  useEffect(() => {
    const q = value.trim()
    if (q === urlQ) return
    const timer = setTimeout(() => {
      if (onList) {
        update({ q: q || undefined }, { replace: true })
      } else {
        void navigate(`/matters?${new URLSearchParams({ q }).toString()}`)
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [value, urlQ, onList, update, navigate])

  // ⌘K (Ctrl+K elsewhere) jumps to search from anywhere in the app.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <label className="flex h-9.5 max-w-110 flex-1 items-center gap-2 rounded-pill border border-border-subtle bg-surface-page px-3 text-fg-muted">
      <Search aria-hidden="true" className="size-3.75 flex-none" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
        }}
        maxLength={200}
        aria-label="Search matters and clients"
        aria-keyshortcuts="Meta+K Control+K"
        placeholder="Search matters and clients…"
        className="min-w-0 flex-1 bg-transparent text-ui leading-none text-fg-strong outline-none placeholder:text-fg-muted"
      />
      <kbd
        aria-hidden="true"
        className="rounded-xs border border-ink-200 bg-surface-card p-1 font-mono text-caption leading-none text-ink-600"
      >
        ⌘K
      </kbd>
    </label>
  )
}
