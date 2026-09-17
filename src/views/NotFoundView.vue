<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found" aria-labelledby="not-found-heading">
    <div class="container">
      <h1 id="not-found-heading">Page not found</h1>
      <p>The page you’re looking for doesn’t exist or may have moved.</p>
      <RouterLink class="btn" to="/">Back to Home</RouterLink>
    </div>
  </section>
</template>
