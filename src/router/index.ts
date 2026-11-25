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
        title: 'SantaSwap — Secret Santa magic, minus the chaos.',
        description:
          'Host a Secret Santa gift exchange, draw names, and share one invite link so everyone can privately see who they are buying for.',
      },
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/JoinView.vue'),
      meta: {
        title: 'See who you’re buying for — SantaSwap',
        description:
          'Enter your phone number to privately see who you’re buying for in your SantaSwap exchange.',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Welcome back — SantaSwap', guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { title: 'Host a Secret Santa — SantaSwap', guestOnly: true },
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
      redirect: '/exchanges/new/details',
    },
    {
      path: '/exchanges/new/details',
      name: 'exchange-new-details',
      component: () => import('@/views/exchange/CreateDetailsView.vue'),
      meta: { title: 'Start your exchange — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/new/participants',
      name: 'exchange-new-participants',
      component: () => import('@/views/exchange/CreateParticipantsView.vue'),
      meta: { title: 'Who’s in the swap? — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/new/groups',
      name: 'exchange-new-groups',
      component: () => import('@/views/exchange/CreateGroupsView.vue'),
      meta: { title: 'Keep it fair — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id/view',
      name: 'exchange-view',
      component: () => import('@/views/exchange/ExchangeOverviewView.vue'),
      meta: { title: 'View exchange — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id/details',
      name: 'exchange-details',
      component: () => import('@/views/exchange/ExchangeDetailsView.vue'),
      meta: { title: 'Exchange details — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id/participants',
      name: 'exchange-participants',
      component: () => import('@/views/exchange/ExchangeParticipantsView.vue'),
      meta: { title: 'Who’s in the swap? — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id/groups',
      name: 'exchange-groups',
      component: () => import('@/views/exchange/ExchangeGroupsView.vue'),
      meta: { title: 'Keep it fair — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id/draw',
      name: 'exchange-draw',
      component: () => import('@/views/exchange/ExchangeDrawView.vue'),
      meta: { title: 'The big draw — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id/invite',
      name: 'exchange-invite',
      component: () => import('@/views/exchange/ExchangeInviteView.vue'),
      meta: { title: 'Spread the cheer — SantaSwap', requiresAuth: true },
    },
    {
      path: '/exchanges/:id',
      name: 'exchange',
      redirect: (to) => `/exchanges/${to.params.id}/details`,
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
          'Read the SantaSwap Privacy Policy, including how we handle names, phone numbers, and Secret Santa assignment information.',
      },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/TermsView.vue'),
      meta: {
        title: 'SantaSwap Terms & Conditions',
        description:
          'Read the SantaSwap Terms & Conditions, including acceptable use of the service.',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: 'Gift got lost — SantaSwap',
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
