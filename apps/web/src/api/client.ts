import createClient from 'openapi-fetch'
import type { paths } from '@casefile/api-types'

type TokenGetter = () => Promise<string | null>

let getToken: TokenGetter | null = null

// Clerk's getToken lives in React context, so the signed-in app hands it over here.
// Every request then asks for a token at send time; Clerk refreshes it when it's about to expire.
export function setTokenGetter(getter: TokenGetter | null) {
  getToken = getter
}

export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })

api.use({
  async onRequest({ request }) {
    const token = getToken ? await getToken() : null
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
})
