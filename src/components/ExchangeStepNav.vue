<script setup lang="ts">
import { RouterLink } from 'vue-router'

export type ExchangeStep = 'details' | 'participants' | 'groups' | 'draw' | 'invite'

const props = defineProps<{
  current: ExchangeStep
  basePath: string
  /** Steps the user is allowed to jump to (e.g. completed create steps). */
  unlocked?: ExchangeStep[]
}>()

const steps: Array<{ id: ExchangeStep; label: string; number: number }> = [
  { id: 'details', label: 'Details', number: 1 },
  { id: 'participants', label: 'Participants', number: 2 },
  { id: 'groups', label: 'Groups', number: 3 },
  { id: 'draw', label: 'Draw names', number: 4 },
  { id: 'invite', label: 'Invite', number: 5 },
]

function hrefFor(step: ExchangeStep) {
  return `${props.basePath}/${step === 'details' ? 'details' : step}`
}

function isUnlocked(step: ExchangeStep) {
  if (!props.unlocked) return true
  return props.unlocked.includes(step)
}
</script>

<template>
  <nav class="stepper" aria-label="Exchange steps">
    <template v-for="(step, index) in steps" :key="step.id">
      <RouterLink
        v-if="isUnlocked(step.id)"
        class="stepper__item"
        :class="{ 'stepper__item--active': current === step.id }"
        :to="hrefFor(step.id)"
      >
        {{ step.number }}. {{ step.label }}
      </RouterLink>
      <span
        v-else
        class="stepper__item stepper__item--locked"
        :class="{ 'stepper__item--active': current === step.id }"
      >
        {{ step.number }}. {{ step.label }}
      </span>
      <span v-if="index < steps.length - 1" class="stepper__sep" aria-hidden="true">→</span>
    </template>
  </nav>
</template>
