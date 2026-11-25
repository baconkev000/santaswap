<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ExchangeDetailsFields from '@/components/ExchangeDetailsFields.vue'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import { useExchangePage } from '@/composables/useExchangePage'
import { deleteExchange, updateExchangeDetails } from '@/services/exchanges'
import { draftFromDetails, emptyDetailsDraft, parseDetailsDraft } from '@/utils/exchangeForm'
import { formatParticipantCount, formatStatusLabel, isDrawn } from '@/utils/exchangeRules'

const router = useRouter()
const { exchangeId, exchange, loading, notFound, loadError, load } = useExchangePage()

const details = ref(emptyDetailsDraft())
const detailsError = ref('')
const budgetError = ref('')
const detailsMessage = ref('')
const savingDetails = ref(false)
const deleting = ref(false)
const deleteError = ref('')

watch(
  exchange,
  (value) => {
    if (value) details.value = draftFromDetails(value)
  },
  { immediate: true },
)

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
    await updateExchangeDetails(exchangeId.value, parsed.details)
    await load()
    detailsMessage.value = 'Details saved.'
  } catch (e) {
    detailsError.value = e instanceof Error ? e.message : "Couldn't save your changes."
  } finally {
    savingDetails.value = false
  }
}

async function handleDelete() {
  if (!exchange.value || !window.confirm(`Delete "${exchange.value.name}"? This cannot be undone.`)) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteExchange(exchangeId.value)
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

      <ExchangeStepNav current="details" :base-path="`/exchanges/${exchangeId}`" />

      <section class="card stack" aria-labelledby="details-heading">
        <div>
          <h2 id="details-heading">The basics</h2>
          <p class="muted">Tweaking the date or budget won’t change who’s spoiling whom.</p>
        </div>
        <form class="stack" novalidate @submit.prevent="saveDetails">
          <ExchangeDetailsFields v-model="details" id-prefix="edit" :budget-error="budgetError" />
          <p v-if="detailsError" class="alert alert--error" role="alert">{{ detailsError }}</p>
          <p v-if="detailsMessage" class="alert alert--success" role="status">{{ detailsMessage }}</p>
          <div class="row">
            <button class="btn btn--secondary" type="submit" :disabled="savingDetails">
              {{ savingDetails ? 'Saving…' : 'Save details' }}
            </button>
            <RouterLink class="btn" :to="`/exchanges/${exchangeId}/participants`">Next: people</RouterLink>
          </div>
        </form>
      </section>

      <section v-if="!isDrawn(exchange.status)" class="card stack" aria-labelledby="delete-heading">
        <div>
          <h2 id="delete-heading">Delete exchange</h2>
          <p class="muted">You can scrap this holiday swap until the elves draw the names.</p>
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
