<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/lib/functions'
import {
  clearParticipantSession,
  fetchAssignment,
  loadParticipantSession,
  lookupExchange,
  normalizeInviteCode,
  requestVerificationCode,
  saveParticipantSession,
  verifyPhone,
  type JoinGroupInfo,
  type ParticipantAssignment,
} from '@/services/join'
import { formatBudgetRange, toE164 } from '@/utils/exchangeRules'

type Step = 'code' | 'loading' | 'phone' | 'verify' | 'assignment' | 'done'

const route = useRoute()
const router = useRouter()

const step = ref<Step>('loading')
const codeInput = ref('')
const inviteCode = ref('')
const group = ref<JoinGroupInfo | null>(null)
const phone = ref('')
const verificationCode = ref('')
const assignment = ref<ParticipantAssignment | null>(null)

const error = ref('')
const notice = ref('')
const busy = ref(false)
const cooldown = ref(0)
const codeExpired = ref(false)
let cooldownTimer: number | undefined

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

function startCooldown(seconds: number) {
  window.clearInterval(cooldownTimer)
  cooldown.value = seconds
  cooldownTimer = window.setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) window.clearInterval(cooldownTimer)
  }, 1000)
}

onBeforeUnmount(() => window.clearInterval(cooldownTimer))

async function showAssignment(token: string): Promise<boolean> {
  try {
    assignment.value = await fetchAssignment(token)
    step.value = 'assignment'
    return true
  } catch (e) {
    clearParticipantSession(inviteCode.value)
    if (e instanceof ApiError && e.code === 'session_expired') return false
    error.value = messageFor(e)
    return false
  }
}

async function lookup(rawCode: string) {
  error.value = ''
  notice.value = ''
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

    const token = loadParticipantSession(code)
    if (token && (await showAssignment(token))) return
    step.value = 'phone'
  } catch (e) {
    step.value = 'code'
    error.value = messageFor(e)
  }
}

async function sendCode() {
  error.value = ''
  notice.value = ''
  codeExpired.value = false
  if (!toE164(phone.value)) {
    error.value = 'Enter a valid mobile number, including area code.'
    return
  }
  busy.value = true
  try {
    const result = await requestVerificationCode(inviteCode.value, phone.value)
    verificationCode.value = ''
    step.value = 'verify'
    startCooldown(result.resendAfterSeconds)
  } catch (e) {
    if (e instanceof ApiError && e.code === 'resend_cooldown') {
      const wait = Number(e.details.retryAfterSeconds) || 30
      startCooldown(wait)
      if (step.value === 'verify') {
        error.value = `Please wait ${wait} seconds before requesting another code.`
        return
      }
    }
    error.value = messageFor(e)
  } finally {
    busy.value = false
  }
}

async function submitVerification() {
  error.value = ''
  const digits = verificationCode.value.replace(/\D/g, '')
  if (digits.length !== 6) {
    error.value = 'Enter the 6-digit code from the text message.'
    return
  }
  busy.value = true
  try {
    const session = await verifyPhone(inviteCode.value, phone.value, digits)
    saveParticipantSession(inviteCode.value, session.sessionToken, session.expiresAt)
    await showAssignment(session.sessionToken)
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'verification_expired' || e.code === 'too_many_attempts') codeExpired.value = true
      if (e.code === 'invalid_verification_code' && typeof e.details.attemptsRemaining === 'number') {
        const left = e.details.attemptsRemaining
        error.value = `${e.message} ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
        return
      }
    }
    error.value = messageFor(e)
  } finally {
    busy.value = false
  }
}

function useDifferentNumber() {
  error.value = ''
  verificationCode.value = ''
  codeExpired.value = false
  step.value = 'phone'
}

function finish() {
  clearParticipantSession(inviteCode.value)
  assignment.value = null
  phone.value = ''
  verificationCode.value = ''
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
        <p>Verify your phone number to privately see who you're buying for.</p>
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

      <form v-else-if="step === 'phone'" class="card stack" novalidate @submit.prevent="sendCode">
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
            Use the number your organizer added to the exchange. We'll text you a 6-digit verification code.
            Message and data rates may apply.
          </span>
        </div>
        <button class="btn btn--block" type="submit" :disabled="busy">
          {{ busy ? 'Sending…' : 'Send verification code' }}
        </button>
      </form>

      <form v-else-if="step === 'verify'" class="card stack" novalidate @submit.prevent="submitVerification">
        <p class="alert alert--info" role="status">
          If <strong>{{ phone }}</strong> is on this exchange's participant list, we've texted it a 6-digit code.
          It expires in 10 minutes.
        </p>
        <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
        <div v-if="!codeExpired" class="field">
          <label for="join-otp">Verification code</label>
          <input
            id="join-otp"
            v-model="verificationCode"
            class="input input--code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern="[0-9]*"
          />
        </div>
        <button v-if="!codeExpired" class="btn btn--block" type="submit" :disabled="busy">
          {{ busy ? 'Verifying…' : 'Verify' }}
        </button>
        <div class="row" style="justify-content: center">
          <button
            class="btn btn--ghost btn--small"
            type="button"
            :disabled="busy || cooldown > 0"
            @click="sendCode"
          >
            {{ cooldown > 0 ? `Resend code in ${cooldown}s` : 'Send a new code' }}
          </button>
          <button class="btn btn--ghost btn--small" type="button" :disabled="busy" @click="useDifferentNumber">
            Use a different number
          </button>
        </div>
        <p class="muted">
          Didn't get a text? Make sure you entered the number your organizer used for you, or ask them to check it.
        </p>
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
        <p class="muted" style="margin-bottom: 1.25rem">Keep it secret! 🤫</p>
        <button class="btn btn--secondary" type="button" @click="finish">Hide my assignment</button>
      </section>

      <div v-else-if="step === 'done'" class="card stack">
        <p class="alert alert--success" role="status">
          Your assignment is hidden. Open your invite link again anytime to see it. You'll just verify your phone
          number again.
        </p>
        <RouterLink class="btn btn--secondary" to="/">Back to SantaSwap</RouterLink>
      </div>
    </template>
  </div>
</template>
