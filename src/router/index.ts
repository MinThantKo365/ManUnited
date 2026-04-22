import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Dashboard.vue'),
    },
    {
      path: '/fixtures',
      name: 'fixtures',
      component: () => import('../views/Fixtures.vue'),
    },
    {
      path: '/players',
      name: 'players',
      component: () => import('../views/Players.vue'),
    },
    {
      path: '/players/:id',
      name: 'player-status',
      component: () => import('../views/PlayerStatus.vue'),
    },
    {
      path: '/league-live',
      name: 'league-live',
      component: () => import('../views/LeagueLive.vue'),
    },
  ],
})

export default router
