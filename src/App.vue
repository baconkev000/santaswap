<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { usePageMeta } from '@/composables/usePageMeta'

usePageMeta()
</script>

<template>
  <div class="site-shell">
    <AppHeader />
    <main class="site-main">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>
