<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import ParticipantForm from '@/components/ParticipantForm.vue'
import { useExchangePage } from '@/composables/useExchangePage'
import {
  addParticipant,
  removeParticipant,
  syncStatusAfterParticipantChange,
  updateParticipant,
  type Participant,
} from '@/services/exchanges'
import {
  formatParticipantCount,
  formatStatusLabel,
  isDrawn,
  validateParticipant,
  type ParticipantInput,
} from '@/utils/exchangeRules'

const { exchangeId, exchange, loading, notFound, loadError, load } = useExchangePage()

const participantForm = ref<InstanceType<typeof ParticipantForm> | null>(null)
const addError = ref('')
const editingId = ref<string | null>(null)
const editError = ref('')
const participantBusy = ref(false)
const participantMessage = ref('')

function confirmClearDraw(): boolean {
  return (
    !exchange.value ||
    !isDrawn(exchange.value.status) ||
    window.confirm(
      "Changing participants clears the current draw. You'll need to draw names again, and everyone will get a new assignment. Continue?",
    )
  )
}

async function changeParticipants(mutate: () => Promise<void>, nextCount: number, success: string) {
  participantBusy.value = true
  participantMessage.value = ''
  try {
    await mutate()
    await syncStatusAfterParticipantChange(exchangeId.value, nextCount)
    await load()
    participantMessage.value = success
  } finally {
    participantBusy.value = false
  }
}

async function handleAdd(input: ParticipantInput) {
  if (!exchange.value) return
  addError.value = validateParticipant(input, exchange.value.participants) ?? ''
  if (addError.value || !confirmClearDraw()) return
  try {
    await changeParticipants(
      () => addParticipant(exchangeId.value, input),
      exchange.value.participants.length + 1,
      `${input.name.trim()} was added.`,
    )
    participantForm.value?.reset()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : "Couldn't add this participant."
  }
}

async function handleContacts(contacts: ParticipantInput[]) {
  if (!exchange.value || !contacts.length) return
  addError.value = ''
  if (!confirmClearDraw()) return

  const working = exchange.value.participants.map((p) => ({
    id: p.id,
    name: p.name,
    phoneNumber: p.phoneNumber,
  }))
  const skipped: string[] = []
  let added = 0
  participantBusy.value = true
  participantMessage.value = ''
  try {
    for (const contact of contacts) {
      const problem = validateParticipant(contact, working)
      if (problem) {
        skipped.push(contact.name.trim() || contact.phoneNumber)
        continue
      }
      await addParticipant(exchangeId.value, contact)
      working.push({
        id: `pending-${added}`,
        name: contact.name.trim(),
        phoneNumber: contact.phoneNumber.trim(),
      })
      added += 1
    }
    await load()
    if (added) {
      participantMessage.value =
        added === 1
          ? '1 participant was added from contacts.'
          : `${added} participants were added from contacts.`
    }
    if (skipped.length) {
      addError.value = `Skipped ${skipped.join(', ')} — already added or missing a valid number.`
    }
  } catch (e) {
    addError.value = e instanceof Error ? e.message : "Couldn't add contacts."
  } finally {
    participantBusy.value = false
  }
}

async function handleEdit(participant: Participant, input: ParticipantInput) {
  if (!exchange.value) return
  editError.value = validateParticipant(input, exchange.value.participants, participant.id) ?? ''
  if (editError.value) return
  const phoneChanged = input.phoneNumber.trim() !== participant.phoneNumber
  const nameChanged = input.name.trim() !== participant.name
  if (!phoneChanged && !nameChanged) {
    editingId.value = null
    return
  }
  try {
    if (phoneChanged) {
      if (!confirmClearDraw()) return
      await changeParticipants(
        () => updateParticipant(exchangeId.value, participant.id, input),
        exchange.value.participants.length,
        'Participant updated.',
      )
    } else {
      participantBusy.value = true
      await updateParticipant(exchangeId.value, participant.id, input)
      await load()
      participantMessage.value = 'Participant updated.'
    }
    editingId.value = null
  } catch (e) {
    editError.value = e instanceof Error ? e.message : "Couldn't update this participant."
  } finally {
    participantBusy.value = false
  }
}

async function handleRemove(participant: Participant) {
  if (!exchange.value) return
  if (!isDrawn(exchange.value.status) && !window.confirm(`Remove ${participant.name} from this exchange?`)) {
    return
  }
  if (!confirmClearDraw()) return
  try {
    await changeParticipants(
      () => removeParticipant(exchangeId.value, participant.id),
      exchange.value.participants.length - 1,
      `${participant.name} was removed.`,
    )
  } catch (e) {
    participantMessage.value = ''
    addError.value = e instanceof Error ? e.message : "Couldn't remove this participant."
  }
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" :to="`/exchanges/${exchangeId}/details`">← Exchange details</RouterLink>

    <p v-if="loading" class="muted" role="status">Loading exchange…</p>

    <div v-else-if="notFound" class="card empty-state">
      <h1>Exchange not found</h1>
      <RouterLink class="btn" to="/dashboard">Back to My Exchanges</RouterLink>
    </div>

    <div v-else-if="loadError && !exchange" class="card stack">
      <p class="alert alert--error" role="alert">{{ loadError }}</p>
      <div><button class="btn btn--secondary" type="button" @click="load">Try again</button></div>
    </div>

    <template v-else-if="exchange">
      <div class="page-header">
        <div>
          <h1>Participants</h1>
          <p class="row">
            <span class="status-pill" :class="`status-pill--${exchange.status}`">
              {{ formatStatusLabel(exchange.status) }}
            </span>
            <span class="muted">{{ formatParticipantCount(exchange.participants.length) }}</span>
          </p>
        </div>
      </div>

      <ExchangeStepNav current="participants" :base-path="`/exchanges/${exchangeId}`" />

      <section class="card" aria-labelledby="participants-heading">
        <h2 id="participants-heading">Participants</h2>
        <p class="card__intro muted">
          Participants use the mobile number you enter here to view their assignment.
        </p>
        <p v-if="participantMessage" class="alert alert--success" role="status" style="margin-bottom: 1rem">
          {{ participantMessage }}
        </p>

        <ul v-if="exchange.participants.length" class="participant-list" style="margin-bottom: 1.25rem">
          <li v-for="participant in exchange.participants" :key="participant.id" class="participant-row">
            <ParticipantForm
              v-if="editingId === participant.id"
              class="participant-row__edit"
              :id-prefix="`edit-${participant.id}`"
              submit-label="Save"
              :initial="{ name: participant.name, phoneNumber: participant.phoneNumber }"
              :error="editError"
              :busy="participantBusy"
              cancellable
              @submit="(input) => handleEdit(participant, input)"
              @cancel="editingId = null"
            />
            <template v-else>
              <div>
                <div class="participant-row__name">{{ participant.name }}</div>
                <div class="participant-row__phone">{{ participant.phoneNumber }}</div>
              </div>
              <div class="row">
                <button
                  class="btn btn--ghost btn--small"
                  type="button"
                  :disabled="participantBusy"
                  @click="
                    editingId = participant.id;
                    editError = ''
                  "
                >
                  Edit<span class="sr-only"> {{ participant.name }}</span>
                </button>
                <button
                  class="btn btn--danger btn--small"
                  type="button"
                  :disabled="participantBusy"
                  @click="handleRemove(participant)"
                >
                  Remove<span class="sr-only"> {{ participant.name }}</span>
                </button>
              </div>
            </template>
          </li>
        </ul>
        <p v-else class="muted" style="margin-bottom: 1rem">No participants yet.</p>

        <h3 style="margin-bottom: 0.75rem">Add a participant</h3>
        <ParticipantForm
          ref="participantForm"
          id-prefix="add-participant"
          submit-label="Add participant"
          :error="addError"
          :busy="participantBusy"
          @submit="handleAdd"
          @contacts="handleContacts"
        />

        <div class="row" style="margin-top: 1.25rem">
          <RouterLink class="btn btn--ghost" :to="`/exchanges/${exchangeId}/details`">Back</RouterLink>
          <RouterLink class="btn" :to="`/exchanges/${exchangeId}/groups`">Continue</RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
