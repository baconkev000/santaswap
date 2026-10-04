<script setup lang="ts">
import type { ExchangeDetailsDraft } from '@/utils/exchangeForm'

const draft = defineModel<ExchangeDetailsDraft>({ required: true })
defineProps<{ idPrefix: string; budgetError?: string }>()
</script>

<template>
  <div class="stack">
    <div class="field">
      <label :for="`${idPrefix}-name`">Exchange name</label>
      <input
        :id="`${idPrefix}-name`"
        v-model="draft.name"
        class="input"
        type="text"
        maxlength="100"
        placeholder="Family Christmas 2026"
        required
      />
    </div>

    <div class="field">
      <label :for="`${idPrefix}-date`">Gift exchange date <span class="field__optional">(optional)</span></label>
      <input
        :id="`${idPrefix}-date`"
        v-model="draft.exchangeDate"
        class="input"
        type="text"
        maxlength="60"
        placeholder="December 20"
      />
    </div>

    <div class="field-grid field-grid--2">
      <div class="field">
        <label :for="`${idPrefix}-min`">Minimum budget <span class="field__optional">(optional)</span></label>
        <input
          :id="`${idPrefix}-min`"
          v-model="draft.minimumBudget"
          class="input"
          type="text"
          inputmode="decimal"
          placeholder="$20"
          :aria-invalid="Boolean(budgetError)"
        />
      </div>
      <div class="field">
        <label :for="`${idPrefix}-max`">Maximum budget <span class="field__optional">(optional)</span></label>
        <input
          :id="`${idPrefix}-max`"
          v-model="draft.maximumBudget"
          class="input"
          type="text"
          inputmode="decimal"
          placeholder="$30"
          :aria-invalid="Boolean(budgetError)"
        />
      </div>
    </div>
    <p v-if="budgetError" class="alert alert--error" role="alert">{{ budgetError }}</p>
  </div>
</template>
