import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { unwrap } from './errors'
import { keys } from './keys'
import type { Clause, Review, ReviewUpdate } from './types'
import { useOrgId } from './useOrgId'

export function useDocument(documentId: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: keys.document(orgId, documentId),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/documents/{document_id}', {
          params: { path: { document_id: documentId } },
          signal,
        }),
      ),
  })
}

export function useClauses(documentId: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: keys.clauses(orgId, documentId),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/documents/{document_id}/clauses', {
          params: { path: { document_id: documentId } },
          signal,
        }),
      ),
  })
}

// Our best guess at what the server will store, mirroring the rules in review_clause.
// The reviewer's name arrives with the refetch once the request settles.
function optimisticReview(update: ReviewUpdate): Review {
  if (update.status === 'unreviewed') {
    return { status: 'unreviewed', note: null, reviewed_by: null, reviewed_at: null }
  }
  const note = update.note?.trim() ?? ''
  return {
    status: update.status,
    // Only flagged clauses keep a note, and an empty note is stored as no note.
    note: update.status === 'flagged' && note !== '' ? note : null,
    reviewed_by: null,
    reviewed_at: new Date().toISOString(),
  }
}

interface ReviewVariables {
  clauseId: string
  update: ReviewUpdate
}

export function useReviewClause(documentId: string) {
  const orgId = useOrgId()
  const queryClient = useQueryClient()
  const clausesKey = keys.clauses(orgId, documentId)
  const mutationKey = [...clausesKey, 'review']

  const setReview = (clauseId: string, review: Review) => {
    queryClient.setQueryData<Clause[]>(clausesKey, (clauses) =>
      clauses?.map((clause) => (clause.id === clauseId ? { ...clause, review } : clause)),
    )
  }

  return useMutation({
    mutationKey,
    mutationFn: ({ clauseId, update }: ReviewVariables) =>
      unwrap(
        api.PUT('/documents/{document_id}/clauses/{clause_id}/review', {
          params: { path: { document_id: documentId, clause_id: clauseId } },
          body: update,
        }),
      ),
    onMutate: async ({ clauseId, update }) => {
      // Stop an in-flight refetch from landing on top of the optimistic change.
      await queryClient.cancelQueries({ queryKey: clausesKey })
      const previous = queryClient
        .getQueryData<Clause[]>(clausesKey)
        ?.find((clause) => clause.id === clauseId)?.review
      setReview(clauseId, optimisticReview(update))
      return { previous }
    },
    onError: (_error, { clauseId }, context) => {
      // Roll back only this clause, so other reviews still in flight keep their changes.
      if (context?.previous) setReview(clauseId, context.previous)
    },
    onSettled: async () => {
      // With several reviews in flight, refetch once after the last one, so an earlier
      // response can't overwrite a later optimistic change.
      if (queryClient.isMutating({ mutationKey }) === 1) {
        await queryClient.invalidateQueries({ queryKey: clausesKey })
      }
      // A review adds an activity event and updates the matter's last activity.
      await queryClient.invalidateQueries({ queryKey: keys.matters(orgId) })
    },
  })
}
