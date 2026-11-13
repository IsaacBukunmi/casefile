import { describe, expect, it } from 'vitest'
import { AVATAR_TONES, avatarTone, shortName } from './people'

describe('shortName', () => {
  it('keeps the first name and the last name’s initial', () => {
    expect(shortName('Maya Okafor')).toBe('Maya O.')
    expect(shortName('Ana de la Cruz')).toBe('Ana C.')
    expect(shortName('  Tom   becker ')).toBe('Tom B.')
  })

  it('leaves a single name as it is', () => {
    expect(shortName('Cher')).toBe('Cher')
  })
})

describe('avatarTone', () => {
  it('always gives the same person the same tone', () => {
    expect(avatarTone('usr_maya')).toBe(avatarTone('usr_maya'))
  })

  it('picks from the design’s four tones, and uses more than one', () => {
    const ids = ['usr_maya', 'usr_daniel', 'usr_sana', 'usr_tom', 'usr_a', 'usr_b']
    const tones = new Set(ids.map(avatarTone))
    for (const tone of tones) expect(AVATAR_TONES).toContain(tone)
    expect(tones.size).toBeGreaterThan(1)
  })
})
