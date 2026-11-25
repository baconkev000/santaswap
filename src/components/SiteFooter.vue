<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <div class="site-footer__brand">
        <span class="brand-wordmark">
          <span class="brand-wordmark__santa">Santa</span><span class="brand-wordmark__swap">Swap</span>
        </span>
        <p>Secret Santa, without the hassle.</p>
      </div>

      <nav aria-label="Footer">
        <ul class="site-footer__links">
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/join">Join an Exchange</RouterLink></li>
          <li><RouterLink to="/privacy">Privacy Policy</RouterLink></li>
          <li><RouterLink to="/terms">Terms &amp; Conditions</RouterLink></li>
        </ul>
      </nav>

      <p class="site-footer__copy">&copy; 2026 SantaSwap</p>
    </div>
  </footer>
</template>
