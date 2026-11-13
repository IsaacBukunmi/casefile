import { describe, expect, it } from 'vitest'
import { MATTER_STATUSES, matterStatusLabels, PRACTICE_AREAS, practiceAreaLabels } from './labels'

describe('labels', () => {
  it('turns API values into human labels', () => {
    expect(matterStatusLabels.in_review).toBe('In review')
    expect(practiceAreaLabels.real_estate).toBe('Real estate')
  })

  it('lists statuses and practice areas in the design’s order', () => {
    expect(MATTER_STATUSES).toEqual(['open', 'in_review', 'closed'])
    expect(PRACTICE_AREAS).toEqual([
      'commercial',
      'employment',
      'real_estate',
      'technology',
      'corporate',
      'privacy',
    ])
  })

  it('labels every value', () => {
    for (const status of MATTER_STATUSES) expect(matterStatusLabels[status]).not.toBe('')
    for (const area of PRACTICE_AREAS) expect(practiceAreaLabels[area]).not.toBe('')
  })
})
