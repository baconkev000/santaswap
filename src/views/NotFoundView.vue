<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found" aria-labelledby="not-found-heading">
    <div class="container">
      <h1 id="not-found-heading">Looks like this gift got lost</h1>
      <p>That page doesn’t exist — or it may have moved.</p>
      <RouterLink class="btn" to="/">Back to SantaSwap</RouterLink>
    </div>
  </section>
</template>
