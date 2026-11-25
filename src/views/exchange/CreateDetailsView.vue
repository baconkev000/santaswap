<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ExchangeDetailsFields from '@/components/ExchangeDetailsFields.vue'
import ExchangeStepNav from '@/components/ExchangeStepNav.vue'
import { useCreateExchangeDraft } from '@/composables/useCreateExchangeDraft'
import { parseDetailsDraft } from '@/utils/exchangeForm'

const router = useRouter()
const { details, save } = useCreateExchangeDraft()
const budgetError = ref('')
const error = ref('')

watch(details, () => save(), { deep: true })

function continueNext() {
  error.value = ''
  budgetError.value = ''
  const parsed = parseDetailsDraft(details.value)
  if (!parsed.ok) {
    if (parsed.field === 'budget') budgetError.value = parsed.error
    else error.value = parsed.error
    return
  }
  save()
  void router.push('/exchanges/new/participants')
}
</script>

<template>
  <div class="page page--medium">
    <RouterLink class="back-link" to="/dashboard">← My Exchanges</RouterLink>
    <div class="page-header">
      <div>
        <h1>Start your exchange</h1>
        <p>Ready to play Santa? Name the holiday swap, pick a date and budget, then gather the crew.</p>
      </div>
    </div>

    <ExchangeStepNav
      current="details"
      base-path="/exchanges/new"
      :unlocked="['details', 'participants', 'groups']"
    />

    <section class="card stack" aria-labelledby="details-heading">
      <div>
        <h2 id="details-heading">The basics</h2>
        <p class="muted">A spending range helps everyone shop without the awkward guesswork.</p>
      </div>
      <ExchangeDetailsFields v-model="details" id-prefix="create" :budget-error="budgetError" />
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <div>
        <button class="btn" type="button" @click="continueNext">Next: add people</button>
      </div>
    </section>
  </div>
</template>
