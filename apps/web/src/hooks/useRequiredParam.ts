import { useParams } from 'react-router'

// For components that only render on a route with this parameter, e.g. /matters/:matterId.
export function useRequiredParam(name: string): string {
  const value = useParams()[name]
  if (!value) {
    throw new Error(`Missing route parameter: ${name}`)
  }
  return value
}
