<script setup lang="ts">
import { ref } from 'vue'
import type { ParticipantInput } from '@/utils/exchangeRules'

const props = withDefaults(
  defineProps<{
    idPrefix: string
    submitLabel: string
    initial?: ParticipantInput
    error?: string
    busy?: boolean
    cancellable?: boolean
  }>(),
  { initial: () => ({ name: '', phoneNumber: '' }), error: '', busy: false, cancellable: false },
)

const emit = defineEmits<{ submit: [ParticipantInput]; cancel: [] }>()

const name = ref(props.initial.name)
const phoneNumber = ref(props.initial.phoneNumber)

function reset() {
  name.value = ''
  phoneNumber.value = ''
}

defineExpose({ reset })
</script>

<template>
  <form class="stack" novalidate @submit.prevent="emit('submit', { name, phoneNumber })">
    <div class="field-grid field-grid--2">
      <div class="field">
        <label :for="`${idPrefix}-name`">Name</label>
        <input :id="`${idPrefix}-name`" v-model="name" class="input" type="text" maxlength="80" autocomplete="off" />
      </div>
      <div class="field">
        <label :for="`${idPrefix}-phone`">Mobile number</label>
        <input
          :id="`${idPrefix}-phone`"
          v-model="phoneNumber"
          class="input"
          type="tel"
          inputmode="tel"
          autocomplete="off"
          placeholder="(555) 123-4567"
        />
      </div>
    </div>
    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <div class="row">
      <button class="btn btn--secondary btn--small" type="submit" :disabled="busy">{{ submitLabel }}</button>
      <button v-if="cancellable" class="btn btn--ghost btn--small" type="button" @click="emit('cancel')">
        Cancel
      </button>
    </div>
  </form>
</template>
