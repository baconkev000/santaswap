<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ExchangeDetailsFields from '@/components/ExchangeDetailsFields.vue'
import ParticipantForm from '@/components/ParticipantForm.vue'
import { createExchange } from '@/services/exchanges'
import { emptyDetailsDraft, parseDetailsDraft } from '@/utils/exchangeForm'
import { validateParticipant, type ParticipantInput } from '@/utils/exchangeRules'

type DraftParticipant = ParticipantInput & { id: string }

const router = useRouter()
const details = ref(emptyDetailsDraft())
const participants = ref<DraftParticipant[]>([])
const participantForm = ref<InstanceType<typeof ParticipantForm> | null>(null)
const participantError = ref('')
const budgetError = ref('')
const error = ref('')
const saving = ref(false)

let nextId = 0

function addParticipant(input: ParticipantInput) {
  participantError.value = validateParticipant(input, participants.value) ?? ''
  if (participantError.value) return
  participants.value.push({ id: `draft-${nextId++}`, name: input.name.trim(), phoneNumber: input.phoneNumber.trim() })
  participantForm.value?.reset()
}

function removeParticipant(id: string) {
  participants.value = participants.value.filter((p) => p.id !== id)
}

async function submit() {
  error.value = ''
  budgetError.value = ''
  const parsed = parseDetailsDraft(details.value)
  if (!parsed.ok) {
    if (parsed.field === 'budget') budgetError.value = parsed.error
    else error.value = parsed.error
    return
  }

  saving.value = true
  try {
    const id = await createExchange(
      parsed.details,
      participants.value.map(({ name, phoneNumber }) => ({ name, phoneNumber })),
    )
    await router.replace(`/exchanges/${id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Couldn't create your exchange."
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" to="/dashboard">← My Exchanges</RouterLink>
    <div class="page-header">
      <div>
        <h1>Create an exchange</h1>
        <p>Set the basics and add everyone who's taking part. You can change all of this later.</p>
      </div>
    </div>

    <section class="card" aria-labelledby="details-heading">
      <h2 id="details-heading">Exchange details</h2>
      <p class="card__intro muted">Set a spending range so everyone knows what to expect.</p>
      <ExchangeDetailsFields v-model="details" id-prefix="create" :budget-error="budgetError" />
    </section>

    <section class="card" aria-labelledby="participants-heading">
      <h2 id="participants-heading">Participants</h2>
      <p class="card__intro muted">
        Add yourself too if you're taking part. Each person verifies this number on the SantaSwap website to see
        their assignment.
      </p>

      <ul v-if="participants.length" class="participant-list" style="margin-bottom: 1.25rem">
        <li v-for="participant in participants" :key="participant.id" class="participant-row">
          <div>
            <div class="participant-row__name">{{ participant.name }}</div>
            <div class="participant-row__phone">{{ participant.phoneNumber }}</div>
          </div>
          <button class="btn btn--danger btn--small" type="button" @click="removeParticipant(participant.id)">
            Remove<span class="sr-only"> {{ participant.name }}</span>
          </button>
        </li>
      </ul>

      <ParticipantForm
        ref="participantForm"
        id-prefix="create-participant"
        submit-label="Add participant"
        :error="participantError"
        @submit="addParticipant"
      />
    </section>

    <div class="card stack">
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <p v-if="participants.length < 2" class="muted">You'll need at least 2 participants before you can draw names.</p>
      <div>
        <button class="btn" type="button" :disabled="saving" @click="submit">
          {{ saving ? 'Creating…' : 'Create exchange' }}
        </button>
      </div>
    </div>
  </div>
</template>
