<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from "vue-router"
import { watch, ref, onMounted, onBeforeUnmount } from "vue"
import { isLoggedIn, logout as doLogout } from "@/stores/auth"
import { cartCount } from "@/stores/cart"
import { fetchUnreadNotifications, markNotificationRead, type NotificationItem } from "@/services/notificationService"

const router = useRouter()

function onLogout() {
  doLogout()
  router.replace({ name: "login" })
}

watch(isLoggedIn, (v) => {
  if (!v) router.replace({ name: "login" })
})

const notifications = ref<NotificationItem[]>([])
const notifOpen = ref(false)
const isLoadingNotif = ref(false)
let intervalId: number | null = null

async function fetchNotifications() {
  isLoadingNotif.value = true
  try {
    notifications.value = await fetchUnreadNotifications()
  } catch {
    // bewusst still: App soll nicht nerven, wenn Server down ist
  } finally {
    isLoadingNotif.value = false
  }
}

async function markRead(id: number) {
  try {
    await markNotificationRead(id)
  } catch {
    // bewusst still
  }
  await fetchNotifications()
}

function toggleNotif() {
  notifOpen.value = !notifOpen.value
}

function onWindowClick() {
  notifOpen.value = false
}

onMounted(() => {
  fetchNotifications()
  intervalId = window.setInterval(fetchNotifications, 8000)
  window.addEventListener("click", onWindowClick)
})

onBeforeUnmount(() => {
  if (intervalId) window.clearInterval(intervalId)
  window.removeEventListener("click", onWindowClick)
})
</script>

<template>
  <header v-if="isLoggedIn" class="topbar">
    <div class="topbar-inner">
      <RouterLink to="/home" class="brand">
        <img src="@/assets/logo.png" class="logo" alt="Logo" />
        <div class="brand-text">
          <div class="name">ShoeLive</div>
          <div class="by">by Friedrich & Nam</div>
        </div>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/home" class="nav-link">Home</RouterLink>
        <RouterLink to="/ads" class="nav-link">Alle Anzeigen</RouterLink>
        <RouterLink to="/profile" class="nav-link">Profil</RouterLink>

        <RouterLink to="/cart" class="icon-btn" title="Warenkorb" aria-label="Warenkorb">
          🛒
          <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
        </RouterLink>

        <button class="icon-btn" type="button" title="Benachrichtigungen" aria-label="Benachrichtigungen" @click.stop="toggleNotif">
          🔔
          <span v-if="notifications.length > 0" class="badge">{{ notifications.length }}</span>

          <div v-if="notifOpen" class="popup" @click.stop>
            <div class="popup-head">
              <div class="popup-title">Benachrichtigungen</div>
              <div class="popup-sub">
                <span v-if="isLoadingNotif">Lade...</span>
                <span v-else>{{ notifications.length }} neu</span>
              </div>
            </div>

            <div v-if="notifications.length === 0" class="popup-empty">
              Keine neuen Meldungen
            </div>

            <div v-else class="popup-list">
              <div v-for="n in notifications" :key="n.id" class="notif-row">
                <div class="notif-text">{{ n.message }}</div>
                <button class="notif-btn" type="button" @click="markRead(n.id)">Gelesen</button>
              </div>
            </div>
          </div>
        </button>

        <button class="logout" type="button" @click="onLogout">Logout</button>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30000;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 0 #000;
}


.topbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  text-decoration: none;
  color: #111827;
  min-width: 0;
}

.logo {
  width: 52px;
  height: auto;
}

.brand-text {
  min-width: 0;
}

.name {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
}

.by {
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  line-height: 1.1;
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-link {
  font-weight: 800;
  text-decoration: none;
  color: #111827;
  padding: 8px 12px;
  border-radius: 10px;
  white-space: nowrap;
}

.nav-link.router-link-active {
  background: rgba(79, 70, 229, 0.10);
}

.icon-btn {
  position: relative;
  border: 2px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #dc2626;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 999px;
}

.logout {
  border: 2px solid #e5e7eb;
  background: #fff;
  padding: 8px 14px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
}

.popup {
  position: absolute;
  right: 0;
  top: 44px;
  background: #fff;
  border: 1px solid rgba(17,24,39,0.12);
  border-radius: 14px;
  padding: 12px;
  width: 320px;
  max-width: min(320px, calc(100vw - 24px));
  box-shadow: 0 16px 40px rgba(0,0,0,0.14);
  z-index: 9999;
}

.popup-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(17,24,39,0.08);
  margin-bottom: 10px;
}

.popup-title {
  font-weight: 900;
  color: #111827;
  font-size: 14px;
}

.popup-sub {
  font-weight: 800;
  color: #6b7280;
  font-size: 12px;
}

.popup-empty {
  color: #6b7280;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 2px;
}

.popup-list {
  max-height: 280px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notif-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: start;
  padding: 10px;
  border: 1px solid rgba(17,24,39,0.08);
  border-radius: 12px;
}

.notif-text {
  font-size: 13px;
  font-weight: 750;
  color: #111827;
  line-height: 1.25;
}

.notif-btn {
  border: none;
  border-radius: 12px;
  padding: 8px 10px;
  font-weight: 900;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  box-shadow: 0 10px 22px rgba(79,70,229,0.45);
  white-space: nowrap;
}

@media (max-width: 820px) {
  .topbar-inner {
    padding: 12px 14px;
    flex-direction: column;
    align-items: stretch;
  }

  .brand {
    justify-content: center;
  }

  .nav {
    justify-content: center;
    gap: 10px;
  }

  .popup {
    right: 0;
    left: auto;
  }
}

@media (max-width: 520px) {
  .logo {
    width: 44px;
  }

  .name {
    font-size: 18px;
  }

  .nav-link {
    padding: 8px 10px;
  }

  .logout {
    padding: 8px 12px;
  }

  .popup {
    right: 0;
    width: 100%;
    max-width: calc(100vw - 24px);
  }
}
</style>
