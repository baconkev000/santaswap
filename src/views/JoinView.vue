<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiError } from '@/lib/api'
import {
  listExchangesForPhone,
  normalizeInviteCode,
  revealAssignment,
  type JoinExchangeOption,
  type ParticipantAssignment,
} from '@/services/join'
import { formatBudgetRange, toE164 } from '@/utils/exchangeRules'

type Step = 'phone' | 'loading' | 'pick' | 'assignment'

const route = useRoute()

const step = ref<Step>('phone')
const phone = ref('')
const inviteCode = ref<string | null>(null)
const exchanges = ref<JoinExchangeOption[]>([])
const selected = ref<JoinExchangeOption | null>(null)
const assignment = ref<ParticipantAssignment | null>(null)

const error = ref('')
const busy = ref(false)

const assignmentBudget = computed(() => {
  const a = assignment.value
  const range = a ? formatBudgetRange(a.minimumBudget, a.maximumBudget) : undefined
  if (!a || !range) return undefined
  if (a.recipients.length < 2) return range
  return a.budgetMode === 'split' ? `${range} total across both gifts` : `${range} per gift`
})

function messageFor(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.'
}

function exchangeBudget(exchange: JoinExchangeOption) {
  return formatBudgetRange(exchange.minimumBudget, exchange.maximumBudget)
}

async function showAssignment(exchange: JoinExchangeOption) {
  selected.value = exchange
  if (!exchange.ready) {
    error.value = "The elves haven't drawn yet — check back once your organizer is ready."
    step.value = 'pick'
    return
  }

  busy.value = true
  error.value = ''
  try {
    assignment.value = await revealAssignment({
      phone: phone.value,
      groupId: exchange.id,
    })
    step.value = 'assignment'
  } catch (e) {
    if (e instanceof ApiError && e.code === 'not_ready') {
      error.value = e.message
      step.value = 'pick'
      return
    }
    error.value = messageFor(e)
    step.value = exchanges.value.length > 1 ? 'pick' : 'phone'
  } finally {
    busy.value = false
  }
}

async function lookupByPhone() {
  error.value = ''
  if (!toE164(phone.value)) {
    error.value = 'Enter a valid mobile number, including area code.'
    return
  }

  busy.value = true
  step.value = 'loading'
  try {
    const found = await listExchangesForPhone(phone.value, inviteCode.value)
    exchanges.value = found
    if (found.length === 1) {
      await showAssignment(found[0]!)
      return
    }
    step.value = 'pick'
  } catch (e) {
    step.value = 'phone'
    error.value = messageFor(e)
  } finally {
    busy.value = false
  }
}

function chooseExchange(exchange: JoinExchangeOption) {
  void showAssignment(exchange)
}

function useDifferentNumber() {
  error.value = ''
  exchanges.value = []
  selected.value = null
  assignment.value = null
  step.value = 'phone'
}

onMounted(() => {
  const queryCode = typeof route.query.code === 'string' ? route.query.code : ''
  inviteCode.value = normalizeInviteCode(queryCode)
  step.value = 'phone'
})
</script>

<template>
  <div class="page page--narrow">
    <div class="page-header">
      <div>
        <h1>Who are you spoiling?</h1>
        <p>
          Ready for a peek? Enter the phone number your organizer saved and we’ll find your holiday
          exchange(s).
        </p>
      </div>
    </div>

    <p v-if="step === 'loading'" class="muted" role="status">The elves are checking the list…</p>

    <form v-else-if="step === 'phone'" class="card stack" novalidate @submit.prevent="lookupByPhone">
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <div class="field">
        <label for="join-phone">Your mobile number</label>
        <input
          id="join-phone"
          v-model="phone"
          class="input"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="(555) 123-4567"
          aria-describedby="join-phone-hint"
        />
        <span id="join-phone-hint" class="field__hint">
          Use the exact number they added to the gift list.
        </span>
      </div>
      <button class="btn btn--block" type="submit" :disabled="busy">
        {{ busy ? 'Searching…' : 'Find my exchange(s)' }}
      </button>
      <p class="muted">
        Hosting instead?
        <RouterLink to="/signup">Start a new exchange</RouterLink>
      </p>
    </form>

    <section v-else-if="step === 'pick'" class="card stack" aria-labelledby="pick-heading">
      <div>
        <h2 id="pick-heading">Pick your holiday swap</h2>
        <p class="muted">That number is on more than one nice list this year.</p>
      </div>
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <ul class="exchange-pick-list">
        <li v-for="exchange in exchanges" :key="exchange.id">
          <button
            class="exchange-pick"
            type="button"
            :disabled="busy"
            @click="chooseExchange(exchange)"
          >
            <span class="exchange-pick__name">{{ exchange.name }}</span>
            <span class="exchange-pick__meta">
              {{ exchange.participantName }}
              <template v-if="exchange.exchangeDate"> · {{ exchange.exchangeDate }}</template>
              <template v-if="exchangeBudget(exchange)"> · {{ exchangeBudget(exchange) }}</template>
            </span>
            <span
              class="status-pill"
              :class="exchange.ready ? 'status-pill--drawn' : 'status-pill--ready_to_draw'"
            >
              {{ exchange.ready ? 'Ready to peek' : 'Elves still drawing' }}
            </span>
          </button>
        </li>
      </ul>
      <button class="btn btn--ghost btn--small" type="button" :disabled="busy" @click="useDifferentNumber">
        Try a different number
      </button>
    </section>

    <section v-else-if="step === 'assignment' && assignment" class="card assignment-reveal" aria-live="polite">
      <p class="muted">{{ assignment.groupName }}</p>
      <p class="assignment-reveal__label" style="margin-top: 1rem">
        Hi {{ assignment.participantName }}! You’re spoiling
        {{ assignment.recipients.length > 1 ? 'these lucky folks' : 'this lucky person' }}:
      </p>
      <p class="assignment-reveal__name">{{ assignment.recipients.join(' & ') }}</p>
      <ul class="detail-list">
        <li v-if="assignmentBudget"><span>Budget</span><strong>{{ assignmentBudget }}</strong></li>
        <li v-if="assignment.exchangeDate"><span>Exchange date</span><strong>{{ assignment.exchangeDate }}</strong></li>
      </ul>
      <p class="muted" style="margin-bottom: 1.25rem">Shhh — Santa’s counting on you to keep it secret!</p>
      <div class="row">
        <RouterLink class="btn btn--secondary" to="/">Back to SantaSwap</RouterLink>
        <button
          v-if="exchanges.length > 1"
          class="btn btn--ghost btn--small"
          type="button"
          @click="step = 'pick'"
        >
          My other exchanges
        </button>
      </div>
    </section>
  </div>
</template>
