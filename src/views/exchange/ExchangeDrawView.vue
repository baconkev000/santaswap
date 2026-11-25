<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import { useExchangePage } from '@/composables/useExchangePage'
import { drawExchange } from '@/services/exchanges'
import { formatParticipantCount, formatStatusLabel, isDrawn } from '@/utils/exchangeRules'

const router = useRouter()
const { exchangeId, exchange, loading, notFound, loadError, load } = useExchangePage()

const drawing = ref(false)
const drawError = ref('')
const drawMessage = ref('')

const drawn = computed(() => (exchange.value ? isDrawn(exchange.value.status) : false))
const canDraw = computed(() => (exchange.value?.participants.length ?? 0) >= 2)

async function handleDraw() {
  drawError.value = ''
  drawMessage.value = ''
  if (!exchange.value) return
  if (
    drawn.value &&
    !window.confirm('Redraw names? Everyone gets a new assignment, including anyone who already viewed theirs.')
  ) {
    return
  }
  if (exchange.value.preventWithinGroupMatches && exchange.value.matchGroups.length === 0) {
    drawError.value = 'Add at least one group before drawing, or turn off the group matching rule.'
    return
  }
  drawing.value = true
  try {
    const result = await drawExchange(exchangeId.value)
    await load()
    drawMessage.value = result.usedDoubleGifts
      ? 'Names drawn with double gifts so everyone could participate.'
      : 'Names drawn! Continue to share the invite link.'
    await router.push(`/exchanges/${exchangeId.value}/invite`)
  } catch (e) {
    drawError.value = e instanceof Error ? e.message : "Couldn't draw names."
  } finally {
    drawing.value = false
  }
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" :to="`/exchanges/${exchangeId}/groups`">← Groups</RouterLink>

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
          <h1>Draw names</h1>
          <p class="row">
            <span class="status-pill" :class="`status-pill--${exchange.status}`">
              {{ formatStatusLabel(exchange.status) }}
            </span>
            <span class="muted">{{ formatParticipantCount(exchange.participants.length) }}</span>
          </p>
        </div>
      </div>

      <ExchangeStepNav current="draw" :base-path="`/exchanges/${exchangeId}`" />

      <section class="card stack" aria-labelledby="draw-heading">
        <div>
          <h2 id="draw-heading">Draw names</h2>
          <p v-if="drawn" class="muted">
            Names have been drawn. Assignments stay private: participants see only their own after entering
            their phone number.
          </p>
          <p v-else-if="canDraw" class="muted">
            When everyone's been added and groups are set, draw names to create the assignments.
          </p>
          <p v-else class="muted">Add at least 2 participants to draw names.</p>
        </div>
        <p v-if="drawMessage" class="alert alert--success" role="status">{{ drawMessage }}</p>
        <p v-if="drawError" class="alert alert--error" role="alert">{{ drawError }}</p>
        <div class="row">
          <RouterLink class="btn btn--ghost" :to="`/exchanges/${exchangeId}/groups`">Back</RouterLink>
          <button
            class="btn"
            :class="{ 'btn--secondary': drawn }"
            type="button"
            :disabled="!canDraw || drawing"
            @click="handleDraw"
          >
            {{ drawing ? 'Drawing…' : drawn ? 'Redraw names' : 'Draw names' }}
          </button>
          <RouterLink v-if="drawn" class="btn btn--secondary" :to="`/exchanges/${exchangeId}/invite`">
            Continue to invite
          </RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
