import type { ParticipantInput } from '@/utils/exchangeRules'

type ContactInfo = {
  name?: string[]
  tel?: string[]
}

type ContactsManager = {
  getProperties: () => Promise<string[]>
  select: (
    properties: string[],
    options?: { multiple?: boolean },
  ) => Promise<ContactInfo[]>
}

function getContactsManager(): ContactsManager | null {
  const nav = navigator as Navigator & { contacts?: ContactsManager }
  if (!nav.contacts || typeof nav.contacts.select !== 'function') return null
  return nav.contacts
}

/** True when the browser can open the system contact picker (mainly Chrome on Android). */
export function canPickContacts(): boolean {
  return Boolean(getContactsManager())
}

export type ContactPickResult =
  | { status: 'selected'; contacts: ParticipantInput[] }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string }

/**
 * Opens the device contact picker when supported.
 * Requires a user gesture and HTTPS. Only the contacts the user chooses are shared.
 */
export async function pickContacts(multiple = true): Promise<ContactPickResult> {
  const manager = getContactsManager()
  if (!manager) {
    return {
      status: 'unavailable',
      message: 'Contact picking isn’t available in this browser. Add people manually instead.',
    }
  }

  try {
    const available = await manager.getProperties()
    const properties = ['name', 'tel'].filter((property) => available.includes(property))
    if (!properties.includes('tel')) {
      return {
        status: 'unavailable',
        message: 'This browser can’t share phone numbers from contacts. Add people manually instead.',
      }
    }

    const selected = await manager.select(properties, { multiple })
    if (!selected.length) return { status: 'cancelled' }

    const contacts: ParticipantInput[] = []
    for (const contact of selected) {
      const name = (contact.name ?? []).map((value) => value.trim()).find(Boolean) || 'Unknown'
      const phoneNumber = (contact.tel ?? []).map((value) => value.trim()).find(Boolean)
      if (!phoneNumber) continue
      contacts.push({ name, phoneNumber })
    }

    if (!contacts.length) {
      return {
        status: 'unavailable',
        message: 'Those contacts didn’t have a phone number. Add them manually instead.',
      }
    }

    return { status: 'selected', contacts }
  } catch (error) {
    // User dismissed the picker, or the browser blocked it.
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    if (message.includes('abort') || message.includes('cancel')) return { status: 'cancelled' }
    return { status: 'cancelled' }
  }
}
