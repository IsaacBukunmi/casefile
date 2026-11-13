import { useClerk, useUser } from '@clerk/react'
import { Ellipsis, LogOut } from 'lucide-react'
import { useMenu } from '@/components/Menu'
import { initials } from './initials'

interface UserMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserMenu({ open, onOpenChange }: UserMenuProps) {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const menu = useMenu({ open, onOpenChange })

  if (!isLoaded || !user) {
    return <div aria-hidden="true" className="mt-auto h-12 rounded-md bg-ink-100" />
  }

  const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? ''
  const email = user.primaryEmailAddress?.emailAddress
  const userInitials =
    user.firstName && user.lastName
      ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
      : initials(name)

  return (
    <div className="relative mt-auto">
      {open && (
        <div
          {...menu.menuProps}
          className="absolute bottom-full left-0 z-10 mb-1 min-w-59 rounded-lg border border-border-subtle bg-surface-card p-1 shadow-3 motion-safe:animate-menu-in"
        >
          <div className="mb-1 border-b border-border-subtle p-2">
            <p className="text-small leading-snug font-medium text-fg-strong">{name}</p>
            {email && (
              <p className="text-caption leading-snug font-normal text-fg-muted">{email}</p>
            )}
          </div>
          <button
            {...menu.itemProps}
            type="button"
            onClick={() => {
              menu.close(false)
              void signOut()
            }}
            className="flex w-full items-center gap-2 rounded-sm p-2 text-left text-small leading-none font-medium text-risk-high hover:bg-risk-high-bg focus-visible:bg-risk-high-bg"
          >
            <LogOut aria-hidden="true" className="size-3.75" />
            Sign out
          </button>
        </div>
      )}
      <button
        {...menu.triggerProps}
        className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-ink-100"
      >
        <span
          aria-hidden="true"
          className="flex size-8 flex-none items-center justify-center rounded-pill bg-blue-100 text-caption font-semibold text-blue-700"
        >
          {userInitials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-small leading-tight font-medium text-fg-strong">{name}</span>
          {email && (
            <span className="truncate text-caption leading-tight font-normal text-fg-muted">
              {email}
            </span>
          )}
        </span>
        <Ellipsis aria-hidden="true" className="size-3.5 flex-none text-fg-muted" />
      </button>
    </div>
  )
}
