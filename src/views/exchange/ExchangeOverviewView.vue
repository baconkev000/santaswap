<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useExchangePage } from '@/composables/useExchangePage'
import {
  getOrganizerAssignments,
  type OrganizerAssignment,
} from '@/services/exchanges'
import {
  buildGroupInviteUrl,
  formatBudgetRange,
  formatParticipantCount,
  formatStatusLabel,
  isDrawn,
} from '@/utils/exchangeRules'

const { exchangeId, exchange, loading, notFound, loadError, load } = useExchangePage()

const assignments = ref<OrganizerAssignment[]>([])
const assignmentsLoading = ref(false)
const assignmentsError = ref('')
const revealed = ref<Set<string>>(new Set())

const inviteUrl = computed(() => (exchange.value ? buildGroupInviteUrl(exchange.value.inviteCode) : ''))
const budget = computed(() =>
  exchange.value
    ? formatBudgetRange(exchange.value.minimumBudget, exchange.value.maximumBudget)
    : undefined,
)
const drawn = computed(() => (exchange.value ? isDrawn(exchange.value.status) : false))

const recipientsByGiver = computed(() => {
  const map = new Map<string, string[]>()
  for (const row of assignments.value) {
    map.set(row.giverId, row.recipients)
  }
  return map
})

function groupNameFor(participantId: string): string | null {
  const group = exchange.value?.matchGroups.find((g) => g.participantIds.includes(participantId))
  return group?.name ?? null
}

function participantName(participantId: string): string {
  return exchange.value?.participants.find((p) => p.id === participantId)?.name ?? 'Unknown'
}

function toggleReveal(participantId: string) {
  const next = new Set(revealed.value)
  if (next.has(participantId)) next.delete(participantId)
  else next.add(participantId)
  revealed.value = next
}

async function loadAssignments() {
  assignmentsLoading.value = true
  assignmentsError.value = ''
  try {
    const result = await getOrganizerAssignments(exchangeId.value)
    assignments.value = result.assignments
  } catch (e) {
    assignmentsError.value = e instanceof Error ? e.message : "Couldn't load assignments."
  } finally {
    assignmentsLoading.value = false
  }
}

watch(
  exchange,
  (value) => {
    if (value && isDrawn(value.status)) void loadAssignments()
  },
  { immediate: true },
)
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
        <RouterLink class="btn btn--secondary" :to="`/exchanges/${exchangeId}/details`">Edit</RouterLink>
      </div>

      <section class="card stack" aria-labelledby="overview-details">
        <h2 id="overview-details">Exchange details</h2>
        <ul class="meta-list">
          <li>Date: {{ exchange.exchangeDate || 'No date set' }}</li>
          <li>Budget: {{ budget ?? 'No budget set' }}</li>
          <li v-if="exchange.preventWithinGroupMatches">
            Groups: people aren't matched within the same group
            <template v-if="exchange.allowDoubleGifts"> (double gifts allowed)</template>
          </li>
          <li v-if="drawn">Invite code: <span class="invite-code">{{ exchange.inviteCode }}</span></li>
        </ul>
        <p v-if="drawn" class="muted">
          Invite link:
          <a :href="inviteUrl">{{ inviteUrl }}</a>
        </p>
      </section>

      <section
        v-if="exchange.preventWithinGroupMatches && exchange.matchGroups.length"
        class="card stack"
        aria-labelledby="overview-groups"
      >
        <h2 id="overview-groups">Groups</h2>
        <ul class="meta-list">
          <li v-for="group in exchange.matchGroups" :key="group.id">
            <strong>{{ group.name }}</strong>
            —
            {{ group.participantIds.map(participantName).join(', ') }}
          </li>
        </ul>
      </section>

      <section class="card stack" aria-labelledby="overview-participants">
        <div>
          <h2 id="overview-participants">Participants</h2>
          <p v-if="drawn" class="muted">
            Click the eye next to someone to see who they're buying for. Keep it secret!
          </p>
          <p v-else class="muted">Names haven't been drawn yet, so assignments aren't available.</p>
        </div>

        <p v-if="assignmentsLoading" class="muted" role="status">Loading assignments…</p>
        <p v-else-if="assignmentsError" class="alert alert--error" role="alert">{{ assignmentsError }}</p>

        <ul class="participant-list">
          <li
            v-for="participant in exchange.participants"
            :key="participant.id"
            class="participant-row participant-row--view"
          >
            <div>
              <div class="participant-row__name">{{ participant.name }}</div>
              <div class="participant-row__phone">{{ participant.phoneNumber }}</div>
              <div v-if="groupNameFor(participant.id)" class="participant-row__group">
                {{ groupNameFor(participant.id) }}
              </div>
              <p
                v-if="drawn && revealed.has(participant.id)"
                class="assignment-peek"
                aria-live="polite"
              >
                Buying for
                <strong>
                  {{ (recipientsByGiver.get(participant.id) ?? []).join(' & ') || '—' }}
                </strong>
              </p>
            </div>
            <button
              v-if="drawn"
              class="icon-btn"
              type="button"
              :aria-pressed="revealed.has(participant.id)"
              :aria-label="
                revealed.has(participant.id)
                  ? `Hide who ${participant.name} is buying for`
                  : `Show who ${participant.name} is buying for`
              "
              @click="toggleReveal(participant.id)"
            >
              <svg
                v-if="!revealed.has(participant.id)"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4.4" />
                <path d="M6.1 6.1C3.7 7.8 2 12 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4.2-.9" />
              </svg>
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
