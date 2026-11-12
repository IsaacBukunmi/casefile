import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { unwrap } from './errors'
import { keys } from './keys'
import type { MatterCreate, MatterListQuery, MatterUpdate } from './types'
import { useOrgId } from './useOrgId'

export function useMatters(params: MatterListQuery) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: keys.matterList(orgId, params),
    queryFn: ({ signal }) => unwrap(api.GET('/matters', { params: { query: params }, signal })),
    // Keep showing the current page while the next page or filter loads.
    placeholderData: keepPreviousData,
  })
}

export function useMatter(matterId: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: keys.matter(orgId, matterId),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/matters/{matter_id}', { params: { path: { matter_id: matterId } }, signal }),
      ),
  })
}

export function useMatterActivity(matterId: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: keys.matterActivity(orgId, matterId),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/matters/{matter_id}/activity', {
          params: { path: { matter_id: matterId } },
          signal,
        }),
      ),
  })
}

export function useMatterDocuments(matterId: string) {
  const orgId = useOrgId()
  return useQuery({
    queryKey: keys.matterDocuments(orgId, matterId),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET('/matters/{matter_id}/documents', {
          params: { path: { matter_id: matterId } },
          signal,
        }),
      ),
  })
}

export function useCreateMatter() {
  const orgId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: MatterCreate) => unwrap(api.POST('/matters', { body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.matterLists(orgId) })
    },
  })
}

export function useUpdateMatter(matterId: string) {
  const orgId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: MatterUpdate) =>
      unwrap(
        api.PATCH('/matters/{matter_id}', { params: { path: { matter_id: matterId } }, body }),
      ),
    onSuccess: async (matter) => {
      queryClient.setQueryData(keys.matter(orgId, matterId), matter)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.matterLists(orgId) }),
        queryClient.invalidateQueries({ queryKey: keys.matterActivity(orgId, matterId) }),
      ])
    },
  })
}
