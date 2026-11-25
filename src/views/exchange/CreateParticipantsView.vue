<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import ParticipantForm from '@/components/ParticipantForm.vue'
import { useCreateExchangeDraft } from '@/composables/useCreateExchangeDraft'
import { parseDetailsDraft } from '@/utils/exchangeForm'
import { validateParticipant, type ParticipantInput } from '@/utils/exchangeRules'

const router = useRouter()
const { details, participants, addParticipant, removeParticipant, save } = useCreateExchangeDraft()
const participantForm = ref<InstanceType<typeof ParticipantForm> | null>(null)
const participantError = ref('')
const error = ref('')

onMounted(() => {
  if (!parseDetailsDraft(details.value).ok) {
    void router.replace('/exchanges/new/details')
  }
})

function handleAdd(input: ParticipantInput) {
  participantError.value = validateParticipant(input, participants.value) ?? ''
  if (participantError.value) return
  addParticipant(input)
  participantForm.value?.reset()
}

function handleContacts(contacts: ParticipantInput[]) {
  participantError.value = ''
  const skipped: string[] = []
  for (const contact of contacts) {
    const problem = validateParticipant(contact, participants.value)
    if (problem) {
      skipped.push(contact.name.trim() || contact.phoneNumber)
      continue
    }
    addParticipant(contact)
  }
  if (skipped.length) {
    participantError.value = `Skipped ${skipped.join(', ')} — already added or missing a valid number.`
  }
}

function continueNext() {
  error.value = ''
  if (participants.value.length < 2) {
    error.value = 'Add at least 2 participants before continuing.'
    return
  }
  save()
  void router.push('/exchanges/new/groups')
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" to="/exchanges/new/details">← Exchange details</RouterLink>
    <div class="page-header">
      <div>
        <h1>Participants</h1>
        <p>Add everyone taking part, including yourself if you're in the exchange.</p>
      </div>
    </div>

    <ExchangeStepNav
      current="participants"
      base-path="/exchanges/new"
      :unlocked="['details', 'participants', 'groups']"
    />

    <section class="card" aria-labelledby="participants-heading">
      <h2 id="participants-heading">Participants</h2>
      <p class="card__intro muted">
        Each person uses this number on the SantaSwap website to see their assignment.
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
        @submit="handleAdd"
        @contacts="handleContacts"
      />

      <p v-if="error" class="alert alert--error" role="alert" style="margin-top: 1rem">{{ error }}</p>
      <div class="row" style="margin-top: 1.25rem">
        <RouterLink class="btn btn--ghost" to="/exchanges/new/details">Back</RouterLink>
        <button class="btn" type="button" @click="continueNext">Continue</button>
      </div>
    </section>
  </div>
</template>
