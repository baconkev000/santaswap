import { computed, ref } from 'vue'
import type { AuthError, Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

const session = ref<Session | null>(null)
const ready = ref(false)
let initPromise: Promise<void> | null = null

/** Resolves once the persisted session (if any) has been restored. Safe to call repeatedly. */
export function initAuth(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (!isSupabaseConfigured) {
      ready.value = true
      return
    }
    const supabase = getSupabase()
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
    })
    ready.value = true
  })()

  return initPromise
}

function friendlyAuthError(error: AuthError): string {
  const message = error.message.toLowerCase()
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address, then log in.'
  }
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (message.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.'
  if (message.includes('password')) return error.message
  return 'Something went wrong. Please try again.'
}

export function useAuth() {
  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => Boolean(session.value))
  const displayName = computed(() => {
    const name = user.value?.user_metadata?.name
    return typeof name === 'string' && name.trim() ? name.trim() : (user.value?.email ?? '')
  })

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(friendlyAuthError(error))
  }

  /** Returns true when Supabase requires email confirmation before the first login. */
  async function signUp(name: string, email: string, password: string): Promise<boolean> {
    const { data, error } = await getSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw new Error(friendlyAuthError(error))
    return !data.session
  }

  async function signOut(): Promise<void> {
    await getSupabase().auth.signOut()
    session.value = null
  }

  async function updateName(name: string): Promise<void> {
    const supabase = getSupabase()
    const trimmed = name.trim()
    const userId = user.value?.id
    if (!userId) throw new Error('Please log in again.')

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: trimmed })
      .eq('id', userId)
    if (profileError) throw new Error("Couldn't update your name. Please try again.")

    const { data, error } = await supabase.auth.updateUser({ data: { name: trimmed } })
    if (error) throw new Error(friendlyAuthError(error))
    if (data.user && session.value) session.value = { ...session.value, user: data.user }
  }

  return { session, user, ready, isAuthenticated, displayName, signIn, signUp, signOut, updateName }
}
