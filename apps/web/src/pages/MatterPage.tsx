import { Link } from 'react-router'
import { isNotFound } from '@/api/errors'
import { useMatter, useMatterDocuments } from '@/api/matters'
import { QueryError } from '@/components/QueryError'
import { useRequiredParam } from '@/hooks/useRequiredParam'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Temporary screen that proves the data layer; Step 8 builds the real one from the design.
export function MatterPage() {
  const matterId = useRequiredParam('matterId')
  const matter = useMatter(matterId)
  const documents = useMatterDocuments(matterId)

  // Another org's matter is a 404 too, so this also covers a link shared across organizations.
  if (isNotFound(matter.error)) return <NotFoundPage />
  if (matter.isError) return <QueryError error={matter.error} />
  if (matter.isPending) return <p className="text-body text-fg-muted">Loading matter…</p>

  return (
    <>
      <h1 className="font-display text-h1 text-fg-strong">{matter.data.name}</h1>
      <p className="mt-1 text-body text-fg-body">{matter.data.client}</p>
      {documents.isError && <QueryError error={documents.error} />}
      <ul className="mt-4">
        {documents.data?.map((doc) => (
          <li key={doc.id}>
            <Link to={`/documents/${doc.id}`} className="text-ui text-action-primary">
              {doc.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
