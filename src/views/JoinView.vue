<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/lib/api'
import {
  lookupExchange,
  normalizeInviteCode,
  revealAssignment,
  type JoinGroupInfo,
  type ParticipantAssignment,
} from '@/services/join'
import { formatBudgetRange, toE164 } from '@/utils/exchangeRules'

type Step = 'code' | 'loading' | 'phone' | 'assignment' | 'done'

const route = useRoute()
const router = useRouter()

const step = ref<Step>('loading')
const codeInput = ref('')
const inviteCode = ref('')
const group = ref<JoinGroupInfo | null>(null)
const phone = ref('')
const assignment = ref<ParticipantAssignment | null>(null)

const error = ref('')
const busy = ref(false)

const budget = computed(() => formatBudgetRange(group.value?.minimumBudget, group.value?.maximumBudget))
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

async function lookup(rawCode: string) {
  error.value = ''
  const code = normalizeInviteCode(rawCode)
  if (!code) {
    step.value = 'code'
    error.value = "That invitation code doesn't look right. Check your invite link and try again."
    return
  }

  step.value = 'loading'
  try {
    group.value = await lookupExchange(code)
    inviteCode.value = code
    if (route.query.code !== code) await router.replace({ query: { code } })
    step.value = 'phone'
  } catch (e) {
    step.value = 'code'
    error.value = messageFor(e)
  }
}

async function reveal() {
  error.value = ''
  if (!toE164(phone.value)) {
    error.value = 'Enter a valid mobile number, including area code.'
    return
  }
  busy.value = true
  try {
    assignment.value = await revealAssignment(inviteCode.value, phone.value)
    step.value = 'assignment'
  } catch (e) {
    if (e instanceof ApiError && e.code === 'not_ready') {
      if (group.value) group.value = { ...group.value, ready: false }
    }
    error.value = messageFor(e)
  } finally {
    busy.value = false
  }
}

function finish() {
  assignment.value = null
  phone.value = ''
  step.value = 'done'
}

onMounted(() => {
  const queryCode = typeof route.query.code === 'string' ? route.query.code : ''
  codeInput.value = queryCode
  if (queryCode) void lookup(queryCode)
  else step.value = 'code'
})
</script>

<template>
  <div class="page page--narrow">
    <div class="page-header">
      <div>
        <h1>Join your exchange</h1>
        <p>Enter the phone number your organizer saved for you to see who you're buying for.</p>
      </div>
    </div>

    <p v-if="step === 'loading'" class="muted" role="status">Loading…</p>

    <form v-else-if="step === 'code'" class="card stack" novalidate @submit.prevent="lookup(codeInput)">
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <div class="field">
        <label for="join-code">Invitation code</label>
        <input
          id="join-code"
          v-model="codeInput"
          class="input invite-code"
          type="text"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="14"
          placeholder="ABCD2345EF"
        />
        <span class="field__hint">You'll find it at the end of the invite link your organizer shared.</span>
      </div>
      <button class="btn btn--block" type="submit">Continue</button>
    </form>

    <template v-else>
      <section v-if="group && step !== 'assignment'" class="card" aria-labelledby="group-heading">
        <p class="muted">Secret Santa Exchange</p>
        <h2 id="group-heading">{{ group.name }}</h2>
        <ul class="meta-list" style="margin-top: 0.5rem">
          <li v-if="group.exchangeDate">Exchange date: {{ group.exchangeDate }}</li>
          <li v-if="budget">Budget: {{ budget }}</li>
        </ul>
      </section>

      <div v-if="group && !group.ready && step === 'phone'" class="card stack">
        <p class="alert alert--info" role="status">
          Your organizer hasn't drawn names yet. Check back once the exchange is ready. You can use the same link.
        </p>
      </div>

      <form v-else-if="step === 'phone'" class="card stack" novalidate @submit.prevent="reveal">
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
            Use the exact number your organizer added to the exchange.
          </span>
        </div>
        <button class="btn btn--block" type="submit" :disabled="busy">
          {{ busy ? 'Looking up…' : 'See my assignment' }}
        </button>
      </form>

      <section v-else-if="step === 'assignment' && assignment" class="card assignment-reveal" aria-live="polite">
        <p class="muted">{{ assignment.groupName }}</p>
        <p class="assignment-reveal__label" style="margin-top: 1rem">
          Hi {{ assignment.participantName }}! You're buying {{ assignment.recipients.length > 1 ? 'gifts' : 'a gift' }} for
        </p>
        <p class="assignment-reveal__name">{{ assignment.recipients.join(' & ') }}</p>
        <ul class="detail-list">
          <li v-if="assignmentBudget"><span>Budget</span><strong>{{ assignmentBudget }}</strong></li>
          <li v-if="assignment.exchangeDate"><span>Exchange date</span><strong>{{ assignment.exchangeDate }}</strong></li>
        </ul>
        <p class="muted" style="margin-bottom: 1.25rem">Keep it secret!</p>
        <button class="btn btn--secondary" type="button" @click="finish">Hide my assignment</button>
      </section>

      <div v-else-if="step === 'done'" class="card stack">
        <p class="alert alert--success" role="status">
          Your assignment is hidden. Open your invite link again anytime to see it.
        </p>
        <RouterLink class="btn btn--secondary" to="/">Back to SantaSwap</RouterLink>
      </div>
    </template>
  </div>
</template>
