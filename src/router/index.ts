import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'SantaSwap — Secret Santa, without the hassle.',
        description:
          'SantaSwap makes Secret Santa exchanges simple. Create your group, draw assignments, and privately notify everyone by text.',
      },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue'),
      meta: {
        title: 'SantaSwap Privacy Policy',
        description:
          'Read the SantaSwap Privacy Policy, including how we handle personal information and Secret Santa SMS messages.',
      },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/TermsView.vue'),
      meta: {
        title: 'SantaSwap Terms & Conditions',
        description:
          'Read the SantaSwap Terms & Conditions, including SMS terms and acceptable use of the service.',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: 'Page not found — SantaSwap',
        description: 'The page you requested could not be found.',
      },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
