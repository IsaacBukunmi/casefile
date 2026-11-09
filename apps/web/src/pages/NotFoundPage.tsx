import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-h2 text-fg-strong">Page not found</h1>
      <p className="mt-2 text-body text-fg-body">
        There&apos;s nothing at this address. Check the link, or go back to your matters.
      </p>
      <Link to="/matters" className="mt-4 inline-block text-label text-action-primary">
        Back to matters
      </Link>
    </div>
  )
}
