import { Briefcase } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import mark from '@/assets/casefile-mark.svg'
import { OrgMenu } from './OrgMenu'
import { UserMenu } from './UserMenu'

type OpenMenu = 'org' | 'user' | null

export function Sidebar() {
  // One state for both menus, so opening one always closes the other.
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const control = (name: Exclude<OpenMenu, null>) => ({
    open: openMenu === name,
    onOpenChange: (open: boolean) => {
      setOpenMenu((current) => (open ? name : current === name ? null : current))
    },
  })

  return (
    <aside className="flex w-63 flex-none flex-col gap-1 border-r border-border-subtle bg-surface-sunken px-3 py-4">
      <div className="flex items-center gap-2 px-2 pt-1 pb-3 font-display text-h3 leading-none font-bold tracking-display text-fg-strong">
        <img src={mark} alt="" className="size-6.5" />
        Casefile
      </div>
      <OrgMenu {...control('org')} />
      <nav aria-label="Main" className="flex flex-col gap-1">
        <NavLink
          to="/matters"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-md p-2 text-ui leading-none font-medium ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-ink-600 hover:bg-ink-100 hover:text-fg-strong'
            }`
          }
        >
          <Briefcase aria-hidden="true" className="size-4.25" />
          Matters
        </NavLink>
      </nav>
      <UserMenu {...control('user')} />
    </aside>
  )
}
