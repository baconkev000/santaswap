<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import MatchGroupsEditor from '@/components/MatchGroupsEditor.vue'
import { useCreateExchangeDraft } from '@/composables/useCreateExchangeDraft'
import { createExchange } from '@/services/exchanges'
import { parseDetailsDraft } from '@/utils/exchangeForm'

const router = useRouter()
const {
  details,
  participants,
  matchGroups,
  preventWithinGroupMatches,
  allowDoubleGifts,
  save,
  clear,
} = useCreateExchangeDraft()
const error = ref('')
const saving = ref(false)

watch(
  [matchGroups, preventWithinGroupMatches, allowDoubleGifts],
  () => save(),
  { deep: true },
)

onMounted(() => {
  if (!parseDetailsDraft(details.value).ok) {
    void router.replace('/exchanges/new/details')
    return
  }
  if (participants.value.length < 2) {
    void router.replace('/exchanges/new/participants')
  }
})

async function submit() {
  error.value = ''
  const parsed = parseDetailsDraft(details.value)
  if (!parsed.ok) {
    void router.replace('/exchanges/new/details')
    return
  }
  if (participants.value.length < 2) {
    void router.replace('/exchanges/new/participants')
    return
  }
  if (preventWithinGroupMatches.value && matchGroups.value.length === 0) {
    error.value = 'Add at least one group, or turn off the group matching rule.'
    return
  }

  saving.value = true
  try {
    const id = await createExchange({
      ...parsed.details,
      participants: participants.value.map(({ id: draftId, name, phoneNumber }) => ({
        id: draftId,
        name,
        phoneNumber,
      })),
      preventWithinGroupMatches: preventWithinGroupMatches.value,
      allowDoubleGifts: allowDoubleGifts.value,
      matchGroups: preventWithinGroupMatches.value
        ? matchGroups.value.map(({ name, participantIds }) => ({ name, participantIds }))
        : [],
    })
    clear()
    await router.replace(`/exchanges/${id}/draw`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Couldn't create your exchange."
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" to="/exchanges/new/participants">← Participants</RouterLink>
    <div class="page-header">
      <div>
        <h1>Groups</h1>
        <p>
          Optional. Keep households or teams from drawing each other, then create the exchange so you
          can draw names.
        </p>
      </div>
    </div>

    <ExchangeStepNav
      current="groups"
      base-path="/exchanges/new"
      :unlocked="['details', 'participants', 'groups']"
    />

    <section class="card stack" aria-labelledby="groups-heading">
      <div>
        <h2 id="groups-heading">Groups</h2>
        <p class="muted">People in the same group won't be assigned to each other when you draw names.</p>
      </div>

      <MatchGroupsEditor
        v-model="matchGroups"
        v-model:prevent-within-group-matches="preventWithinGroupMatches"
        v-model:allow-double-gifts="allowDoubleGifts"
        :participants="participants"
        :busy="saving"
      />

      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <div class="row">
        <RouterLink class="btn btn--ghost" to="/exchanges/new/participants">Back</RouterLink>
        <button class="btn" type="button" :disabled="saving" @click="submit">
          {{ saving ? 'Creating…' : 'Create exchange & continue' }}
        </button>
      </div>
    </section>
  </div>
</template>
