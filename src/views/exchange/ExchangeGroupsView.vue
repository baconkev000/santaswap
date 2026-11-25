<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import MatchGroupsEditor, { type MatchGroupDraft } from '@/components/MatchGroupsEditor.vue'
import { useExchangePage } from '@/composables/useExchangePage'
import { saveMatchGroups, updateMatchSettings } from '@/services/exchanges'
import { formatParticipantCount, formatStatusLabel, isDrawn } from '@/utils/exchangeRules'

const { exchangeId, exchange, loading, notFound, loadError, load } = useExchangePage()

const matchGroups = ref<MatchGroupDraft[]>([])
const preventWithinGroupMatches = ref(false)
const allowDoubleGifts = ref(false)
const groupsBusy = ref(false)
const groupsMessage = ref('')
const groupsError = ref('')

watch(
  exchange,
  (value) => {
    if (!value) return
    preventWithinGroupMatches.value = value.preventWithinGroupMatches
    allowDoubleGifts.value = value.allowDoubleGifts
    matchGroups.value = value.matchGroups.map((group) => ({ ...group }))
  },
  { immediate: true },
)

function confirmClearDraw(): boolean {
  return (
    !exchange.value ||
    !isDrawn(exchange.value.status) ||
    window.confirm(
      "Changing groups clears the current draw. You'll need to draw names again, and everyone will get a new assignment. Continue?",
    )
  )
}

async function persistGroups() {
  if (!exchange.value) return
  groupsError.value = ''
  groupsMessage.value = ''
  if (preventWithinGroupMatches.value && matchGroups.value.length === 0) {
    groupsError.value = 'Add at least one group, or turn off the group matching rule.'
    return
  }
  if (!confirmClearDraw()) return

  groupsBusy.value = true
  try {
    await updateMatchSettings(exchangeId.value, {
      preventWithinGroupMatches: preventWithinGroupMatches.value,
      allowDoubleGifts: allowDoubleGifts.value,
    })
    await saveMatchGroups(
      exchangeId.value,
      preventWithinGroupMatches.value
        ? matchGroups.value.map(({ name, participantIds }) => ({ name, participantIds }))
        : [],
    )
    await load()
    groupsMessage.value = 'Groups saved.'
  } catch (e) {
    groupsError.value = e instanceof Error ? e.message : "Couldn't save groups."
  } finally {
    groupsBusy.value = false
  }
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" :to="`/exchanges/${exchangeId}/participants`">← Participants</RouterLink>

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
          <h1>Groups</h1>
          <p class="row">
            <span class="status-pill" :class="`status-pill--${exchange.status}`">
              {{ formatStatusLabel(exchange.status) }}
            </span>
            <span class="muted">{{ formatParticipantCount(exchange.participants.length) }}</span>
          </p>
        </div>
      </div>

      <ExchangeStepNav current="groups" :base-path="`/exchanges/${exchangeId}`" />

      <section class="card stack" aria-labelledby="groups-heading">
        <div>
          <h2 id="groups-heading">Groups</h2>
          <p class="muted">
            Optional. Keep people in the same household or team from drawing each other.
          </p>
        </div>
        <p v-if="groupsMessage" class="alert alert--success" role="status">{{ groupsMessage }}</p>
        <p v-if="groupsError" class="alert alert--error" role="alert">{{ groupsError }}</p>
        <MatchGroupsEditor
          v-model="matchGroups"
          v-model:prevent-within-group-matches="preventWithinGroupMatches"
          v-model:allow-double-gifts="allowDoubleGifts"
          :participants="exchange.participants"
          :busy="groupsBusy"
          show-save-button
          @save="persistGroups"
        />
        <div class="row">
          <RouterLink class="btn btn--ghost" :to="`/exchanges/${exchangeId}/participants`">Back</RouterLink>
          <RouterLink class="btn" :to="`/exchanges/${exchangeId}/draw`">Continue</RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>
