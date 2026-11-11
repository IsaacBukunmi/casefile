import { useClauses, useDocument, useReviewClause } from '@/api/documents'
import { isNotFound } from '@/api/errors'
import { QueryError } from '@/components/QueryError'
import { useRequiredParam } from '@/hooks/useRequiredParam'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Temporary screen that proves the data layer; Step 9 builds the real review screen.
export function DocumentPage() {
  const documentId = useRequiredParam('documentId')
  const doc = useDocument(documentId)
  const clauses = useClauses(documentId)
  const review = useReviewClause(documentId)

  console.log(clauses)

  if (isNotFound(doc.error)) return <NotFoundPage />
  if (doc.isError) return <QueryError error={doc.error} />
  if (doc.isPending) return <p className="text-body text-fg-muted">Loading document…</p>

  return (
    <>
      <h1 className="font-display text-h1 text-fg-strong">{doc.data.title}</h1>
      {review.isError && <QueryError error={review.error} />}
      {clauses.isError && <QueryError error={clauses.error} />}
      {clauses.data?.length === 0 && (
        <p className="mt-4 text-body text-fg-muted">No clauses for this document yet.</p>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {clauses.data?.map((clause) => (
          <li key={clause.id} className="flex items-center gap-3 text-ui text-fg-body">
            <span>
              § {clause.section_ref} {clause.clause_type}: {clause.review.status}
            </span>
            <button
              type="button"
              className="text-label text-action-primary"
              onClick={() => {
                review.mutate({ clauseId: clause.id, update: { status: 'accepted' } })
              }}
            >
              Accept
            </button>
            <button
              type="button"
              className="text-label text-action-primary"
              onClick={() => {
                review.mutate({ clauseId: clause.id, update: { status: 'unreviewed' } })
              }}
            >
              Reset
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
