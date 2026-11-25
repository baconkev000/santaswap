<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { canPickContacts, pickContacts } from '@/utils/contacts'
import type { ParticipantInput } from '@/utils/exchangeRules'

const props = withDefaults(
  defineProps<{
    idPrefix: string
    submitLabel: string
    initial?: ParticipantInput
    error?: string
    busy?: boolean
    cancellable?: boolean
    /** When true, contact picker can return several people at once. */
    allowMultipleContacts?: boolean
  }>(),
  {
    initial: () => ({ name: '', phoneNumber: '' }),
    error: '',
    busy: false,
    cancellable: false,
    allowMultipleContacts: true,
  },
)

const emit = defineEmits<{
  submit: [ParticipantInput]
  contacts: [ParticipantInput[]]
  cancel: []
}>()

const name = ref(props.initial.name)
const phoneNumber = ref(props.initial.phoneNumber)
const contactsSupported = ref(false)
const picking = ref(false)
const pickError = ref('')

onMounted(() => {
  contactsSupported.value = canPickContacts()
})

function reset() {
  name.value = ''
  phoneNumber.value = ''
  pickError.value = ''
}

async function addFromContacts() {
  pickError.value = ''
  picking.value = true
  try {
    const result = await pickContacts(props.allowMultipleContacts)
    if (result.status === 'cancelled') return
    if (result.status === 'unavailable') {
      pickError.value = result.message
      return
    }
    emit('contacts', result.contacts)
    reset()
  } finally {
    picking.value = false
  }
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
    <p v-if="error || pickError" class="alert alert--error" role="alert">{{ error || pickError }}</p>
    <div class="row">
      <button
        v-if="contactsSupported"
        class="btn btn--secondary btn--small"
        type="button"
        :disabled="busy || picking"
        @click="addFromContacts"
      >
        {{ picking ? 'Opening contacts…' : 'Pick from contacts' }}
      </button>
      <button class="btn btn--secondary btn--small" type="submit" :disabled="busy || picking">
        {{ submitLabel }}
      </button>
      <button v-if="cancellable" class="btn btn--ghost btn--small" type="button" @click="emit('cancel')">
        Cancel
      </button>
    </div>
    <p v-if="contactsSupported" class="field__hint">
      On supported phones, pick people from your contacts. SantaSwap only gets the ones you choose.
    </p>
  </form>
</template>
