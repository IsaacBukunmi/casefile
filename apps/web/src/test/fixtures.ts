import type { ApiError, Clause, DocumentDetail, Matter, Person } from '@/api/types'

// Typed against the generated schema: if the API changes shape, these stop compiling.
export const maya: Person = { id: 'usr_maya', name: 'Maya Okafor', initials: 'MO' }

export function buildMatter(overrides: Partial<Matter> = {}): Matter {
  return {
    id: 'mat_1',
    name: 'Acme Ltd – Supplier agreement',
    client: 'Acme Ltd',
    practice_area: 'commercial',
    status: 'in_review',
    owner: maya,
    document_count: 1,
    last_activity_at: '2026-11-01T09:00:00Z',
    ...overrides,
  }
}

export function buildDocument(overrides: Partial<DocumentDetail> = {}): DocumentDetail {
  return {
    id: 'doc_1',
    matter_id: 'mat_1',
    name: 'Master Services Agreement.pdf',
    file_type: 'pdf',
    pages: 22,
    uploaded_by: maya,
    uploaded_at: '2026-11-01T08:00:00Z',
    analysis: { status: 'ready', progress: 100, risk_counts: { high: 1, medium: 0, low: 0 } },
    title: 'Master Services Agreement',
    parties: null,
    sections: [],
    ...overrides,
  }
}

export function buildClause(overrides: Partial<Clause> = {}): Clause {
  return {
    id: 'cl_1',
    document_id: 'doc_1',
    section_ref: '7.1',
    clause_type: 'Limitation of liability',
    risk: 'high',
    explanation: 'Liability is uncapped for the supplier.',
    detail: 'There is no cap on direct damages.',
    suggested_revision: null,
    review: { status: 'unreviewed', note: null, reviewed_by: null, reviewed_at: null },
    ...overrides,
  }
}

export function buildApiError(overrides: Partial<ApiError> = {}): ApiError {
  return {
    code: 'not_found',
    message: 'Matter not found.',
    reference: 'CF-TEST-01',
    details: null,
    ...overrides,
  }
}
