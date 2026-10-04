<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ExchangeDetailsFields from '@/components/ExchangeDetailsFields.vue'
import ParticipantForm from '@/components/ParticipantForm.vue'
import {
  addParticipant,
  deleteExchange,
  drawExchange,
  getExchange,
  removeParticipant,
  syncStatusAfterParticipantChange,
  updateExchangeDetails,
  updateParticipant,
  type ExchangeDetail,
  type Participant,
} from '@/services/exchanges'
import { draftFromDetails, emptyDetailsDraft, parseDetailsDraft } from '@/utils/exchangeForm'
import {
  buildGroupInviteUrl,
  formatParticipantCount,
  formatStatusLabel,
  isDrawn,
  validateParticipant,
  type ParticipantInput,
} from '@/utils/exchangeRules'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

const exchange = ref<ExchangeDetail | null>(null)
const loading = ref(true)
const notFound = ref(false)
const loadError = ref('')

const details = ref(emptyDetailsDraft())
const detailsError = ref('')
const budgetError = ref('')
const detailsMessage = ref('')
const savingDetails = ref(false)

const participantForm = ref<InstanceType<typeof ParticipantForm> | null>(null)
const addError = ref('')
const editingId = ref<string | null>(null)
const editError = ref('')
const participantBusy = ref(false)
const participantMessage = ref('')

const drawing = ref(false)
const drawError = ref('')
const drawMessage = ref('')

const copied = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const drawn = computed(() => (exchange.value ? isDrawn(exchange.value.status) : false))
const inviteUrl = computed(() => (exchange.value ? buildGroupInviteUrl(exchange.value.inviteCode) : ''))
const canDraw = computed(() => (exchange.value?.participants.length ?? 0) >= 2)

async function load() {
  loadError.value = ''
  try {
    const result = await getExchange(groupId)
    if (!result) {
      notFound.value = true
      return
    }
    exchange.value = result
    details.value = draftFromDetails(result)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : "Couldn't load this exchange."
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function saveDetails() {
  detailsError.value = ''
  budgetError.value = ''
  detailsMessage.value = ''
  const parsed = parseDetailsDraft(details.value)
  if (!parsed.ok) {
    if (parsed.field === 'budget') budgetError.value = parsed.error
    else detailsError.value = parsed.error
    return
  }
  savingDetails.value = true
  try {
    await updateExchangeDetails(groupId, parsed.details)
    await load()
    detailsMessage.value = 'Details saved.'
  } catch (e) {
    detailsError.value = e instanceof Error ? e.message : "Couldn't save your changes."
  } finally {
    savingDetails.value = false
  }
}

function confirmClearDraw(): boolean {
  return (
    !drawn.value ||
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
    await syncStatusAfterParticipantChange(groupId, nextCount)
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
      () => addParticipant(groupId, input),
      exchange.value.participants.length + 1,
      `${input.name.trim()} was added.`,
    )
    participantForm.value?.reset()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : "Couldn't add this participant."
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
        () => updateParticipant(participant.id, input),
        exchange.value.participants.length,
        'Participant updated.',
      )
    } else {
      // Renaming keeps the same person, so the existing draw stays valid.
      participantBusy.value = true
      await updateParticipant(participant.id, input)
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
  if (!drawn.value && !window.confirm(`Remove ${participant.name} from this exchange?`)) return
  if (!confirmClearDraw()) return
  try {
    await changeParticipants(
      () => removeParticipant(participant.id),
      exchange.value.participants.length - 1,
      `${participant.name} was removed.`,
    )
  } catch (e) {
    participantMessage.value = ''
    addError.value = e instanceof Error ? e.message : "Couldn't remove this participant."
  }
}

async function handleDraw() {
  drawError.value = ''
  drawMessage.value = ''
  if (
    drawn.value &&
    !window.confirm('Redraw names? Everyone gets a new assignment, including anyone who already viewed theirs.')
  ) {
    return
  }
  drawing.value = true
  try {
    await drawExchange(groupId)
    await load()
    drawMessage.value = 'Names drawn! Share the invite link so everyone can see who they are buying for.'
  } catch (e) {
    drawError.value = e instanceof Error ? e.message : "Couldn't draw names."
  } finally {
    drawing.value = false
  }
}

async function copyInvite(event: Event) {
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
  } catch {
    const input = (event.currentTarget as HTMLElement).parentElement?.querySelector('input')
    input?.select()
    document.execCommand('copy')
  }
  copied.value = true
  window.setTimeout(() => (copied.value = false), 2500)
}

async function handleDelete() {
  if (!exchange.value || !window.confirm(`Delete "${exchange.value.name}"? This cannot be undone.`)) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteExchange(groupId)
    await router.replace('/dashboard')
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : "Couldn't delete this exchange."
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" to="/dashboard">← My Exchanges</RouterLink>

    <p v-if="loading" class="muted" role="status">Loading exchange…</p>

    <div v-else-if="notFound" class="card empty-state">
      <h1>Exchange not found</h1>
      <p>This exchange doesn't exist or belongs to a different account.</p>
      <RouterLink class="btn" to="/dashboard">Back to My Exchanges</RouterLink>
    </div>

    <div v-else-if="loadError && !exchange" class="card stack">
      <p class="alert alert--error" role="alert">{{ loadError }}</p>
      <div><button class="btn btn--secondary" type="button" @click="load">Try again</button></div>
    </div>

    <template v-else-if="exchange">
      <div class="page-header">
        <div>
          <h1>{{ exchange.name }}</h1>
          <p class="row">
            <span class="status-pill" :class="`status-pill--${exchange.status}`">
              {{ formatStatusLabel(exchange.status) }}
            </span>
            <span class="muted">{{ formatParticipantCount(exchange.participants.length) }}</span>
          </p>
        </div>
      </div>

      <section class="card stack" aria-labelledby="invite-heading">
        <div>
          <h2 id="invite-heading">Invite Participants</h2>
          <p class="muted">
            Share this link with everyone in your exchange by text, email, or group chat. Each person verifies
            their phone number to privately see only their own assignment.
          </p>
        </div>
        <div class="invite-box">
          <label for="invite-url" class="sr-only">Invitation link</label>
          <input id="invite-url" class="input" type="text" :value="inviteUrl" readonly @focus="($event.target as HTMLInputElement).select()" />
          <button class="btn btn--small" type="button" @click="copyInvite">{{ copied ? 'Copied!' : 'Copy' }}</button>
        </div>
        <p class="muted">Invitation code: <span class="invite-code">{{ exchange.inviteCode }}</span></p>
        <p v-if="!drawn" class="alert alert--info">
          Draw names before sharing. Until then, the link only shows the exchange details.
        </p>
      </section>

      <section class="card stack" aria-labelledby="draw-heading">
        <div>
          <h2 id="draw-heading">Draw names</h2>
          <p v-if="drawn" class="muted">
            Names have been drawn. Assignments stay private: participants see only their own after verifying their
            phone number.
          </p>
          <p v-else-if="canDraw" class="muted">When everyone's been added, draw names to create the assignments.</p>
          <p v-else class="muted">Add at least 2 participants to draw names.</p>
        </div>
        <p v-if="exchange.hasSubgroupRules" class="alert alert--info">
          This exchange uses subgroup rules from the SantaSwap app. They'll be applied when names are drawn.
        </p>
        <p v-if="drawMessage" class="alert alert--success" role="status">{{ drawMessage }}</p>
        <p v-if="drawError" class="alert alert--error" role="alert">{{ drawError }}</p>
        <div>
          <button
            class="btn"
            :class="{ 'btn--secondary': drawn }"
            type="button"
            :disabled="!canDraw || drawing"
            @click="handleDraw"
          >
            {{ drawing ? 'Drawing…' : drawn ? 'Redraw names' : 'Draw names' }}
          </button>
        </div>
      </section>

      <section class="card" aria-labelledby="participants-heading">
        <h2 id="participants-heading">Participants</h2>
        <p class="card__intro muted">Participants verify the mobile number you enter here to view their assignment.</p>
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
        />
      </section>

      <section class="card" aria-labelledby="details-heading">
        <h2 id="details-heading">Exchange details</h2>
        <p class="card__intro muted">Changing the date or budget doesn't affect who's buying for whom.</p>
        <form class="stack" novalidate @submit.prevent="saveDetails">
          <ExchangeDetailsFields v-model="details" id-prefix="edit" :budget-error="budgetError" />
          <p v-if="detailsError" class="alert alert--error" role="alert">{{ detailsError }}</p>
          <p v-if="detailsMessage" class="alert alert--success" role="status">{{ detailsMessage }}</p>
          <div>
            <button class="btn btn--secondary" type="submit" :disabled="savingDetails">
              {{ savingDetails ? 'Saving…' : 'Save details' }}
            </button>
          </div>
        </form>
      </section>

      <section v-if="!drawn" class="card stack" aria-labelledby="delete-heading">
        <div>
          <h2 id="delete-heading">Delete exchange</h2>
          <p class="muted">Exchanges can be deleted until names are drawn.</p>
        </div>
        <p v-if="deleteError" class="alert alert--error" role="alert">{{ deleteError }}</p>
        <div>
          <button class="btn btn--danger" type="button" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Deleting…' : 'Delete exchange' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
