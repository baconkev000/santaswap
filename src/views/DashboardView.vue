<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { listExchanges, type ExchangeSummary } from '@/services/exchanges'
import { formatBudgetRange, formatParticipantCount, formatStatusLabel } from '@/utils/exchangeRules'

const { displayName } = useAuth()
const exchanges = ref<ExchangeSummary[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    exchanges.value = await listExchanges()
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Couldn't load your exchanges."
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page container">
    <div class="page-header">
      <div>
        <h1>My SantaSwap</h1>
        <p v-if="displayName">Welcome back, {{ displayName }} — let's get wrapping.</p>
        <p v-else>Your gift exchanges, all in one place.</p>
      </div>
      <RouterLink class="btn" to="/exchanges/new">Start a new exchange</RouterLink>
    </div>

    <section aria-labelledby="my-exchanges-heading">
      <h2 id="my-exchanges-heading" class="sr-only">My Exchanges</h2>

      <p v-if="loading" class="muted" role="status">Loading your exchanges…</p>

      <div v-else-if="error" class="card stack">
        <p class="alert alert--error" role="alert">{{ error }}</p>
        <div><button class="btn btn--secondary" type="button" @click="load">Try again</button></div>
      </div>

      <div v-else-if="exchanges.length === 0" class="card empty-state">
        <h3>No exchanges yet</h3>
        <p>Start your first Secret Santa and get the gift list going.</p>
        <RouterLink class="btn" to="/exchanges/new">Start a new exchange</RouterLink>
      </div>

      <ul v-else class="exchange-grid">
        <li v-for="exchange in exchanges" :key="exchange.id" class="exchange-card">
          <div class="exchange-card__top">
            <h3>{{ exchange.name }}</h3>
            <span class="status-pill" :class="`status-pill--${exchange.status}`">
              {{ formatStatusLabel(exchange.status) }}
            </span>
          </div>
          <ul class="meta-list">
            <li>{{ exchange.exchangeDate || 'No date set' }}</li>
            <li>{{ formatBudgetRange(exchange.minimumBudget, exchange.maximumBudget) ?? 'No budget set' }}</li>
            <li>{{ formatParticipantCount(exchange.participantCount) }}</li>
          </ul>
          <div class="exchange-card__actions">
            <RouterLink class="btn btn--secondary btn--small" :to="`/exchanges/${exchange.id}/view`">
              View
            </RouterLink>
            <RouterLink class="btn btn--small" :to="`/exchanges/${exchange.id}/details`">
              Edit
            </RouterLink>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
