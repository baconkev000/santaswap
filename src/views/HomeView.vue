<script setup lang="ts">
const features = [
  {
    title: 'Create Your Exchange',
    description: 'Set up a Secret Santa group and add everyone in seconds.',
    icon: 'gift',
  },
  {
    title: 'Draw Names',
    description:
      'SantaSwap handles the assignments and supports optional subgroup restrictions and double gifts.',
    icon: 'draw',
  },
  {
    title: 'Send the Assignments',
    description:
      "Each participant can receive a private SMS telling them who they're buying for.",
    icon: 'send',
  },
] as const
</script>

<template>
  <div>
    <section class="hero" aria-labelledby="hero-heading">
      <div class="container">
        <div class="hero__panel">
          <p class="hero__eyebrow">Mobile Secret Santa</p>
          <h1 id="hero-heading">SantaSwap</h1>
          <p class="hero__tagline">Secret Santa, without the hassle.</p>
          <p class="hero__lead">
            Create a gift exchange, add your friends and family, draw the
            assignments, and let SantaSwap privately text everyone who they're
            buying for.
          </p>
          <a class="btn" href="#">Get SantaSwap</a>
        </div>
      </div>
    </section>

    <section class="features" aria-labelledby="features-heading">
      <div class="container">
        <h2 id="features-heading" class="sr-only">Features</h2>
        <div class="features__grid">
          <article v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-card__icon" aria-hidden="true">
              <svg
                v-if="feature.icon === 'gift'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="10" width="18" height="11" rx="2" />
                <path d="M12 10v11M3 14h18" />
                <path d="M12 10c-2.2 0-4-1.3-4-3s1.8-2.5 4-1c2.2-1.5 4-.1 4 1.5s-1.8 2.5-4 2.5Z" />
              </svg>
              <svg
                v-else-if="feature.icon === 'draw'"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M8 7h8M8 12h5M8 17h6" />
                <path d="M16.5 14.5 20 18l-1.5 1.5-3.5-3.5Z" />
                <rect x="3" y="4" width="14" height="16" rx="2" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
              </svg>
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
