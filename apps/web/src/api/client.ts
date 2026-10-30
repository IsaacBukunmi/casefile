import createClient from 'openapi-fetch'
import type { paths } from '@casefile/api-types'

export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })
