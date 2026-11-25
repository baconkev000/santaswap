<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { user, displayName, updateName, signOut } = useAuth()
const router = useRouter()

const name = ref('')
const saving = ref(false)
const message = ref('')
const error = ref('')

watchEffect(() => {
  name.value = user.value?.name?.trim() || ''
})

async function save() {
  message.value = ''
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Enter your name.'
    return
  }
  saving.value = true
  try {
    await updateName(name.value)
    message.value = 'Your name has been updated.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Couldn't update your name."
  } finally {
    saving.value = false
  }
}

async function logOut() {
  await signOut()
  await router.push({ name: 'home' })
}
</script>

<template>
  <div class="page page--narrow">
    <div class="page-header">
      <div>
        <h1>Your account</h1>
        <p>{{ displayName }}</p>
      </div>
    </div>

    <form class="card stack" novalidate @submit.prevent="save">
      <h2>Profile</h2>
      <p v-if="message" class="alert alert--success" role="status">{{ message }}</p>
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

      <div class="field">
        <label for="account-name">Name</label>
        <input id="account-name" v-model="name" class="input" type="text" autocomplete="name" maxlength="80" />
      </div>

      <div class="field">
        <label for="account-email">Email</label>
        <input id="account-email" class="input" type="email" :value="user?.email ?? ''" disabled />
        <span class="field__hint">Used to log in on the web and in the SantaSwap app.</span>
      </div>

      <div><button class="btn" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
    </form>

    <div class="card stack">
      <h2>Log out</h2>
      <p class="muted">You'll need to log back in to manage your gift exchanges.</p>
      <div><button class="btn btn--secondary" type="button" @click="logOut">Log out</button></div>
    </div>
  </div>
</template>
