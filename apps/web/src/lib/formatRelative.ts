const MINUTE = 60_000

// "Just now", "5 min ago", "3 h ago", "Yesterday", "6 days ago", then a date ("23 Oct").
// Same thresholds and rounding as the design prototype's fmt().
export function formatRelative(date: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / MINUTE)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${String(minutes)} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${String(hours)} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 14) return `${String(days)} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
