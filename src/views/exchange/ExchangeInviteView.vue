<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import { useExchangePage } from '@/composables/useExchangePage'
import {
  buildGroupInviteUrl,
  formatParticipantCount,
  formatStatusLabel,
  isDrawn,
} from '@/utils/exchangeRules'

const { exchangeId, exchange, loading, notFound, loadError, load } = useExchangePage()
const copied = ref(false)

const drawn = computed(() => (exchange.value ? isDrawn(exchange.value.status) : false))
const inviteUrl = computed(() => (exchange.value ? buildGroupInviteUrl(exchange.value.inviteCode) : ''))

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
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" :to="`/exchanges/${exchangeId}/draw`">← Draw names</RouterLink>

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
          <h1>Spread the cheer</h1>
          <p class="row">
            <span class="status-pill" :class="`status-pill--${exchange.status}`">
              {{ formatStatusLabel(exchange.status) }}
            </span>
            <span class="muted">{{ formatParticipantCount(exchange.participants.length) }}</span>
          </p>
        </div>
      </div>

      <ExchangeStepNav current="invite" :base-path="`/exchanges/${exchangeId}`" />

      <section class="card stack" aria-labelledby="invite-heading">
        <div>
          <h2 id="invite-heading">Share the invite</h2>
          <p class="muted">
            Send out one festive invite link by text, email, or group chat. Each person opens it,
            enters their number, and peeks at who they’re spoiling — then can come back anytime with
            that same number for another look.
          </p>
        </div>
        <div class="invite-box">
          <label for="invite-url" class="sr-only">Invitation link</label>
          <input
            id="invite-url"
            class="input"
            type="text"
            :value="inviteUrl"
            readonly
            @focus="($event.target as HTMLInputElement).select()"
          />
          <button class="btn btn--small" type="button" @click="copyInvite">
            {{ copied ? 'Copied!' : 'Copy invite link' }}
          </button>
        </div>
        <p v-if="!drawn" class="alert alert--info">
          Let the elves draw names before sharing — until then, the link only shows the exchange details.
        </p>
        <div class="row">
          <RouterLink class="btn btn--ghost" :to="`/exchanges/${exchangeId}/draw`">Back</RouterLink>
          <RouterLink class="btn btn--secondary" to="/dashboard">All set!</RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
