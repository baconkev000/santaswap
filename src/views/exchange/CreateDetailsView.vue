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
        <h1>Create an exchange</h1>
        <p>Start with the basics. You'll add people, set groups, draw names, then share the invite.</p>
      </div>
    </div>

    <ExchangeStepNav
      current="details"
      base-path="/exchanges/new"
      :unlocked="['details', 'participants', 'groups']"
    />

    <section class="card stack" aria-labelledby="details-heading">
      <div>
        <h2 id="details-heading">Exchange details</h2>
        <p class="muted">Set a spending range so everyone knows what to expect.</p>
      </div>
      <ExchangeDetailsFields v-model="details" id-prefix="create" :budget-error="budgetError" />
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <div>
        <button class="btn" type="button" @click="continueNext">Continue</button>
      </div>
    </section>
  </div>
</template>
