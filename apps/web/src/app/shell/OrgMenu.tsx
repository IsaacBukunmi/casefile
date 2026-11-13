import { useOrganization, useOrganizationList } from '@clerk/react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMenu } from '@/components/Menu'
import { initials } from './initials'

interface OrgMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function memberCount(count: number) {
  return `${String(count)} ${count === 1 ? 'member' : 'members'}`
}

export function OrgMenu({ open, onOpenChange }: OrgMenuProps) {
  const { isLoaded, organization } = useOrganization()
  const list = useOrganizationList({ userMemberships: true })
  const navigate = useNavigate()
  const [switchFailed, setSwitchFailed] = useState(false)
  const menu = useMenu({
    open,
    onOpenChange: (next) => {
      setSwitchFailed(false)
      onOpenChange(next)
    },
  })

  if (!isLoaded || !organization) {
    return <div aria-hidden="true" className="mb-2 h-12 rounded-md bg-ink-100" />
  }

  const choose = async (orgId: string) => {
    if (orgId === organization.id || !list.setActive) {
      menu.close(true)
      return
    }
    setSwitchFailed(false)
    try {
      await list.setActive({ organization: orgId })
      menu.close(true)
      // An open matter belongs to the old organization, so switching goes back to the list.
      void navigate('/matters')
    } catch {
      setSwitchFailed(true)
    }
  }

  return (
    <div className="relative mb-2">
      <button
        {...menu.triggerProps}
        className="flex w-full items-center gap-2 rounded-md border border-border-subtle bg-surface-card p-2 text-left shadow-1 hover:border-ink-200"
      >
        <span
          aria-hidden="true"
          className="flex size-7.5 flex-none items-center justify-center rounded-sm bg-action-primary text-caption font-semibold text-fg-on-brand"
        >
          {initials(organization.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-small leading-tight font-medium text-fg-strong">
            {organization.name}
          </span>
          <span className="text-caption leading-tight font-normal text-fg-muted">
            {memberCount(organization.membersCount)}
          </span>
        </span>
        <ChevronsUpDown aria-hidden="true" className="size-3.5 flex-none text-fg-muted" />
      </button>
      {open && (
        <div
          {...menu.menuProps}
          className="absolute top-full left-0 z-10 mt-1 min-w-59 rounded-lg border border-border-subtle bg-surface-card p-1 shadow-3 motion-safe:animate-menu-in"
        >
          <p className="px-2 py-1 text-caption tracking-wider text-fg-muted uppercase">
            Organizations
          </p>
          {list.userMemberships.isLoading ? (
            <div {...menu.itemProps} aria-disabled="true" className="p-2 text-small text-fg-muted">
              Loading organizations…
            </div>
          ) : (
            (list.userMemberships.data ?? []).map(({ organization: org }) => {
              const isCurrent = org.id === organization.id
              return (
                <button
                  key={org.id}
                  {...menu.itemProps}
                  type="button"
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => void choose(org.id)}
                  className="flex w-full items-center gap-2 rounded-sm p-2 text-left hover:bg-surface-page focus-visible:bg-surface-page"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 flex-none items-center justify-center rounded-xs bg-blue-50 text-caption font-semibold text-blue-700"
                  >
                    {initials(org.name)}
                  </span>
                  <span className="flex-1 text-small leading-tight font-medium text-fg-strong">
                    {org.name}
                  </span>
                  {isCurrent && (
                    <Check aria-hidden="true" className="size-3.5 text-action-primary" />
                  )}
                </button>
              )
            })
          )}
          {switchFailed && (
            <p role="alert" className="px-2 py-1 text-caption text-risk-high">
              Couldn’t switch organization. Try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
