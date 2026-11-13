import { describe, expect, it } from 'vitest'
import { parseMatterListParams } from './useMatterListParams'

const parse = (search: string) => parseMatterListParams(new URLSearchParams(search))

describe('parseMatterListParams', () => {
  it('reads every supported filter', () => {
    expect(parse('q=acme&status=open&practice_area=privacy&sort=name&order=asc&page=3')).toEqual({
      q: 'acme',
      status: 'open',
      practice_area: 'privacy',
      sort: 'name',
      order: 'asc',
      page: 3,
    })
  })

  it('drops values the API would reject', () => {
    expect(parse('status=bogus&practice_area=sports&sort=size&order=up&page=-2')).toEqual({})
  })

  it('does not treat built-in object properties as valid values', () => {
    expect(parse('status=toString&sort=hasOwnProperty')).toEqual({})
  })

  it('drops defaults so equivalent URLs share a cache entry', () => {
    expect(parse('sort=last_activity&order=desc&page=1')).toEqual({})
  })

  it('trims the search text and caps it at the API limit', () => {
    expect(parse('q=%20%20acme%20%20')).toEqual({ q: 'acme' })
    expect(parse(`q=${'a'.repeat(250)}`).q).toHaveLength(200)
    expect(parse('q=%20%20')).toEqual({})
  })

  it('ignores page numbers that are not whole numbers', () => {
    expect(parse('page=2.5')).toEqual({})
    expect(parse('page=two')).toEqual({})
  })

  it('ignores parameters the list does not use', () => {
    expect(parse('page_size=100&debug=1')).toEqual({})
  })
})
