import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { initAuth, useAuth } from '@/composables/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

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
          'SantaSwap makes Secret Santa exchanges simple. Create your group, draw names, and share one invite link so everyone can privately see who they are buying for.',
      },
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/JoinView.vue'),
      meta: {
        title: 'Join a Secret Santa exchange — SantaSwap',
        description:
          'Verify your phone number to privately view your SantaSwap Secret Santa assignment.',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Log in — SantaSwap', guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { title: 'Create your account — SantaSwap', guestOnly: true },
    },
    {
      path: '/dashboard',
      alias: '/exchanges',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'My SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/new',
      name: 'exchange-new',
      component: () => import('@/views/CreateExchangeView.vue'),
      meta: { title: 'Create an exchange — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id',
      name: 'exchange',
      component: () => import('@/views/ExchangeView.vue'),
      meta: { title: 'Manage exchange — SantaSwap', requiresAuth: true },
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/AccountView.vue'),
      meta: { title: 'Account — SantaSwap', requiresAuth: true },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue'),
      meta: {
        title: 'SantaSwap Privacy Policy',
        description:
          'Read the SantaSwap Privacy Policy, including how we handle personal information and SMS phone verification.',
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

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return true

  await initAuth()
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && isAuthenticated.value) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
