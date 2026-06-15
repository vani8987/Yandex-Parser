import { createRouter, createWebHistory } from 'vue-router'
import { AuthStore } from '@/stores/Auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login/Login.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings/Settings.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = AuthStore()

  if (to.meta.requiresAuth && !authStore.user) {
    await authStore.me()
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return { name: 'login' }
  }
})

export default router
