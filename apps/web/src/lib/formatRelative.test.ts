import { describe, expect, it } from 'vitest'
import { formatRelative } from './formatRelative'

// Midday UTC, so the date output is the same calendar day in any test machine's time zone.
const now = new Date('2026-10-23T12:00:00Z')
const ago = (ms: number) => formatRelative(new Date(now.getTime() - ms), now)
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('formatRelative', () => {
  it('says "Just now" under a minute, and for future times', () => {
    expect(ago(0)).toBe('Just now')
    expect(ago(59 * SECOND)).toBe('Just now')
    expect(ago(-5 * MINUTE)).toBe('Just now')
  })

  it('counts whole minutes under an hour', () => {
    expect(ago(MINUTE)).toBe('1 min ago')
    expect(ago(59 * MINUTE + 59 * SECOND)).toBe('59 min ago')
  })

  it('rounds to the nearest hour under a day', () => {
    expect(ago(60 * MINUTE)).toBe('1 h ago')
    expect(ago(90 * MINUTE)).toBe('2 h ago')
    expect(ago(23.4 * HOUR)).toBe('23 h ago')
  })

  it('says "Yesterday" once the hours round up to a day', () => {
    expect(ago(23.6 * HOUR)).toBe('Yesterday')
    expect(ago(35 * HOUR)).toBe('Yesterday')
  })

  it('counts days under two weeks', () => {
    expect(ago(36 * HOUR)).toBe('2 days ago')
    expect(ago(13 * DAY)).toBe('13 days ago')
  })

  it('shows a short British date from two weeks', () => {
    expect(ago(14 * DAY)).toBe('9 Oct')
    expect(ago(400 * DAY)).toBe('18 Sept')
  })
})
