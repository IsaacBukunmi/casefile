import type { MatterStatus, PracticeArea } from '@/api/types'

// One place for every human label of an API enum. A Record over the generated union fails to
// compile if the API adds a value we haven't labelled.
export const matterStatusLabels: Record<MatterStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  closed: 'Closed',
}

export const practiceAreaLabels: Record<PracticeArea, string> = {
  commercial: 'Commercial',
  employment: 'Employment',
  real_estate: 'Real estate',
  technology: 'Technology',
  corporate: 'Corporate',
  privacy: 'Privacy',
}

// The design's order, for chips and selects. Object key order follows insertion order.
export const MATTER_STATUSES = Object.keys(matterStatusLabels) as MatterStatus[]
export const PRACTICE_AREAS = Object.keys(practiceAreaLabels) as PracticeArea[]
