import type { MatterListQuery } from './types'

// Every key starts with the org, so two organizations never share cached data.
// Keys are nested so one prefix invalidates everything under it.
export const keys = {
  org: (orgId: string) => ['org', orgId] as const,
  matters: (orgId: string) => [...keys.org(orgId), 'matters'] as const,
  matterLists: (orgId: string) => [...keys.matters(orgId), 'list'] as const,
  matterList: (orgId: string, params: MatterListQuery) =>
    [...keys.matterLists(orgId), params] as const,
  matter: (orgId: string, matterId: string) =>
    [...keys.matters(orgId), 'detail', matterId] as const,
  matterActivity: (orgId: string, matterId: string) =>
    [...keys.matter(orgId, matterId), 'activity'] as const,
  matterDocuments: (orgId: string, matterId: string) =>
    [...keys.matter(orgId, matterId), 'documents'] as const,
  document: (orgId: string, documentId: string) =>
    [...keys.org(orgId), 'documents', documentId] as const,
  clauses: (orgId: string, documentId: string) =>
    [...keys.document(orgId, documentId), 'clauses'] as const,
}
