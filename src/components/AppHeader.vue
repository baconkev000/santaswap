<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <RouterLink class="brand-link" to="/" aria-label="SantaSwap home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path
              d="M12 2.5 13.1 8.2 18.8 7.1 14.4 11.1 18.2 15.6 12.5 13.4 8.9 18.5 9.2 12.6 3.5 10.9 9.1 9.1 7.2 3.6 12 6.2Z"
            />
          </svg>
        </span>
        SantaSwap
      </RouterLink>
      <nav aria-label="Primary">
        <ul class="nav-links">
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/privacy">Privacy Policy</RouterLink></li>
          <li><RouterLink to="/terms">Terms &amp; Conditions</RouterLink></li>
        </ul>
      </nav>
    </div>
  </header>
</template>
