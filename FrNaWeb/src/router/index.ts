import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import AllAdsView from '@/views/AllAdsView.vue'
import CreateAdView from '@/views/CreateAdView.vue'
import RegisterView from '@/views/RegisterView.vue'
import CartView from "@/views/CartView.vue"
import ProfileView from "@/views/ProfileView.vue"



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/ads', name: 'ads', component: AllAdsView },
    { path: '/ads/new', name: 'create-ad', component: CreateAdView },
    { path: "/cart", name: "cart", component: CartView },
    { path: "/profile", name: "profile", component: ProfileView },

  ],
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('loggedIn')
  const publicPages = ['login', 'register']

  if (!isLoggedIn && !publicPages.includes(String(to.name))) {
    next({ name: 'login' })
  } else if (isLoggedIn && publicPages.includes(String(to.name))) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
