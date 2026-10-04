import { FunctionsHttpError } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

/** Calls a Supabase Edge Function and surfaces its `{ error, message }` body on failure. */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, { body })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await (error.context as Response).json().catch(() => null)
      if (payload && typeof payload.error === 'string') {
        throw new ApiError(
          payload.error,
          typeof payload.message === 'string' ? payload.message : 'Something went wrong.',
          payload,
        )
      }
    }
    throw new ApiError('network_error', "We couldn't reach SantaSwap. Check your connection and try again.")
  }

  return data as T
}
