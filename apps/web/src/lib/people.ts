// "Maya Okafor" → "Maya O.", "Ana de la Cruz" → "Ana C.", "Cher" → "Cher".
export function shortName(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = words[0] ?? ''
  const last = words.length > 1 ? words.at(-1) : undefined
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first
}

// The design's four avatar colour pairs (tokens in theme.css).
export const AVATAR_TONES = [
  'bg-avatar-1-bg text-avatar-1-fg',
  'bg-avatar-2-bg text-avatar-2-fg',
  'bg-avatar-3-bg text-avatar-3-fg',
  'bg-avatar-4-bg text-avatar-4-fg',
] as const

// The same person always gets the same colour, on every screen and every load.
export function avatarTone(personId: string): (typeof AVATAR_TONES)[number] {
  let hash = 0
  for (const char of personId) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? AVATAR_TONES[0]
}
