import type { Person } from '@/api/types'
import { avatarTone } from '@/lib/people'

// Initials in a coloured circle. Decorative: the person's name is always shown next to it.
export function PersonAvatar({ person }: { person: Person }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 flex-none items-center justify-center rounded-pill text-caption leading-none font-semibold ${avatarTone(person.id)}`}
    >
      {person.initials}
    </span>
  )
}
