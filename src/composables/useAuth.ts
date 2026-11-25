import { computed, ref } from 'vue'
import { api, ApiError, getToken, setToken } from '@/lib/api'

export type AuthUser = {
  id: string
  email: string
  name: string | null
}

const user = ref<AuthUser | null>(null)
const ready = ref(false)
let initPromise: Promise<void> | null = null

function decodeTokenUser(token: string): AuthUser | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      sub?: string
      email?: string
      name?: string | null
      exp?: number
    }
    if (!json.sub || !json.email) return null
    if (typeof json.exp === 'number' && json.exp * 1000 <= Date.now()) return null
    return { id: json.sub, email: json.email, name: json.name ?? null }
  } catch {
    return null
  }
}

/** Restores the session from localStorage immediately — no network wait. */
export function initAuth(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    const token = getToken()
    if (token) {
      const cached = decodeTokenUser(token)
      if (cached) user.value = cached
      else setToken(null)
    }
    ready.value = true
  })()

  return initPromise
}

function friendlyAuthError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(user.value))
  const displayName = computed(() => {
    const name = user.value?.name
    return typeof name === 'string' && name.trim() ? name.trim() : (user.value?.email ?? '')
  })

  async function signIn(email: string, password: string): Promise<void> {
    try {
      const result = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
        body: { email, password },
        auth: false,
      })
      setToken(result.token)
      user.value = result.user
    } catch (error) {
      throw new Error(friendlyAuthError(error))
    }
  }

  /** Always signs the user in immediately (no email confirmation step). */
  async function signUp(name: string, email: string, password: string): Promise<boolean> {
    try {
      const result = await api<{ token: string; user: AuthUser }>('/api/auth/signup', {
        body: { name, email, password },
        auth: false,
      })
      setToken(result.token)
      user.value = result.user
      return false
    } catch (error) {
      throw new Error(friendlyAuthError(error))
    }
  }

  async function signOut(): Promise<void> {
    setToken(null)
    user.value = null
  }

  async function updateName(name: string): Promise<void> {
    try {
      const result = await api<{ token: string; user: AuthUser }>('/api/auth/me', {
        method: 'PATCH',
        body: { name },
      })
      setToken(result.token)
      user.value = result.user
    } catch (error) {
      throw new Error(friendlyAuthError(error))
    }
  }

  return {
    session: computed(() => (user.value ? { user: user.value } : null)),
    user,
    ready,
    isAuthenticated,
    displayName,
    signIn,
    signUp,
    signOut,
    updateName,
  }
}
