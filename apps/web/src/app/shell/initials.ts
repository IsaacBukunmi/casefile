// "Harlow & Lane" → "HL", "Northgate Group" → "NG", "Acme" → "A". Words without letters
// (such as "&") are skipped.
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => (/\p{L}/u.exec(word)?.[0] ?? '').toUpperCase())
    .join('')
}
