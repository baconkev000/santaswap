<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, signOut } = useAuth()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

async function logOut() {
  await signOut()
  menuOpen.value = false
  await router.push({ name: 'home' })
}
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink class="brand-link" :to="isAuthenticated ? '/dashboard' : '/'" aria-label="SantaSwap home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path
              d="M12 2.5 13.1 8.2 18.8 7.1 14.4 11.1 18.2 15.6 12.5 13.4 8.9 18.5 9.2 12.6 3.5 10.9 9.1 9.1 7.2 3.6 12 6.2Z"
            />
          </svg>
        </span>
        <span class="brand-wordmark">
          <span class="brand-wordmark__santa">Santa</span><span class="brand-wordmark__swap">Swap</span>
        </span>
      </RouterLink>

      <button
        type="button"
        class="nav-toggle"
        :aria-expanded="menuOpen"
        aria-controls="site-nav"
        @click="menuOpen = !menuOpen"
      >
        <span class="sr-only">{{ menuOpen ? 'Close menu' : 'Open menu' }}</span>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path v-if="menuOpen" d="M6 6l12 12M18 6 6 18" />
          <path v-else d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <nav id="site-nav" class="site-nav" :class="{ 'site-nav--open': menuOpen }" aria-label="Primary">
        <ul v-if="isAuthenticated" class="nav-links">
          <li><RouterLink to="/dashboard">Dashboard</RouterLink></li>
          <li><RouterLink to="/exchanges">My Exchanges</RouterLink></li>
          <li><RouterLink to="/exchanges/new">Create Exchange</RouterLink></li>
          <li><RouterLink to="/account">Account</RouterLink></li>
          <li><button type="button" @click="logOut">Log out</button></li>
        </ul>
        <ul v-else class="nav-links">
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/join">Join Exchange</RouterLink></li>
          <li><RouterLink to="/privacy">Privacy</RouterLink></li>
          <li><RouterLink to="/terms">Terms</RouterLink></li>
          <li><RouterLink to="/login">Log in</RouterLink></li>
          <li><RouterLink class="nav-cta" to="/signup">Sign up</RouterLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>
