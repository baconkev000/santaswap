<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const MIN_PASSWORD_LENGTH = 8

const { signUp } = useAuth()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const confirmationSentTo = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Enter your name.'
    return
  }
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
    error.value = 'Enter a valid email address.'
    return
  }
  if (password.value.length < MIN_PASSWORD_LENGTH) {
    error.value = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    return
  }

  submitting.value = true
  try {
    const needsConfirmation = await signUp(name.value, email.value, password.value)
    if (needsConfirmation) {
      confirmationSentTo.value = email.value.trim()
    } else {
      await router.replace('/dashboard')
    }
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
        <h1>Create a new exchange</h1>
        <p>Make an organizer account, then set up your Secret Santa and invite everyone with one link.</p>
      </div>
    </div>

    <div v-if="confirmationSentTo" class="card stack">
      <p class="alert alert--success" role="status">
        Almost there! We sent a confirmation link to <strong>{{ confirmationSentTo }}</strong>.
        Open it to activate your account, then log in.
      </p>
      <RouterLink class="btn btn--block" to="/login">Go to log in</RouterLink>
    </div>

    <form v-else class="card stack" novalidate @submit.prevent="submit">
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

      <div class="field">
        <label for="signup-name">Name</label>
        <input id="signup-name" v-model="name" class="input" type="text" autocomplete="name" maxlength="80" required />
      </div>

      <div class="field">
        <label for="signup-email">Email</label>
        <input id="signup-email" v-model="email" class="input" type="email" autocomplete="email" required />
      </div>

      <div class="field">
        <label for="signup-password">Password</label>
        <input
          id="signup-password"
          v-model="password"
          class="input"
          type="password"
          autocomplete="new-password"
          :minlength="MIN_PASSWORD_LENGTH"
          aria-describedby="signup-password-hint"
          required
        />
        <span id="signup-password-hint" class="field__hint">At least {{ MIN_PASSWORD_LENGTH }} characters.</span>
      </div>

      <button class="btn btn--block" type="submit" :disabled="submitting">
        {{ submitting ? 'Creating…' : 'Create account & continue' }}
      </button>

      <p class="muted">
        By creating an account you agree to the
        <RouterLink to="/terms">Terms &amp; Conditions</RouterLink> and
        <RouterLink to="/privacy">Privacy Policy</RouterLink>.
      </p>
    </form>

    <p class="auth-switch">
      Already have an account? <RouterLink to="/login">Log in</RouterLink>
    </p>
  </div>
</template>
