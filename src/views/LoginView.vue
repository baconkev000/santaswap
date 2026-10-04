<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { signIn } = useAuth()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

function safeRedirect(): string {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
    ? target
    : '/dashboard'
}

async function submit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Enter your email and password.'
    return
  }
  submitting.value = true
  try {
    await signIn(email.value, password.value)
    await router.replace(safeRedirect())
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page page--narrow">
    <div class="page-header">
      <div>
        <h1>Log in</h1>
        <p>Use the same account as the SantaSwap app.</p>
      </div>
    </div>

    <form class="card stack" novalidate @submit.prevent="submit">
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

      <div class="field">
        <label for="login-email">Email</label>
        <input id="login-email" v-model="email" class="input" type="email" autocomplete="email" required />
      </div>

      <div class="field">
        <label for="login-password">Password</label>
        <input
          id="login-password"
          v-model="password"
          class="input"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>

      <button class="btn btn--block" type="submit" :disabled="submitting">
        {{ submitting ? 'Logging in…' : 'Log in' }}
      </button>
    </form>

    <p class="auth-switch">
      New to SantaSwap? <RouterLink to="/signup">Create an account</RouterLink>
    </p>
  </div>
</template>
