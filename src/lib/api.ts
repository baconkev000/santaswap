export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

const TOKEN_KEY = 'santaswap.auth.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Private mode — auth just won't persist across reloads.
  }
}

function apiBase(): string {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
  return configured || ''
}

type ApiOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  token?: string | null
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = options.token === undefined ? getToken() : options.token
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(
      'network_error',
      "We couldn't reach SantaSwap. Check your connection and try again.",
    )
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (payload && typeof payload.error === 'string') {
      throw new ApiError(
        payload.error,
        typeof payload.message === 'string' ? payload.message : 'Something went wrong.',
        payload,
      )
    }
    throw new ApiError('server_error', 'Something went wrong. Please try again.')
  }

  return payload as T
}
