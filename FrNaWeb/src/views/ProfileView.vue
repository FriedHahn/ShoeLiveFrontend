<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getAuthToken } from "@/stores/auth"

type Ad = {
  id: number
  brand: string
  size: string
  price: string
  ownerEmail: string
  buyerEmail?: string | null
  imagePath?: string | null
}

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL

const email = ref("")
const totalAds = ref(0)

const soldCount = ref(0)
const revenueTotal = ref("0.00")

const boughtCount = ref(0)
const spentTotal = ref("0.00")

const soldAds = ref<Ad[]>([])
const boughtAds = ref<Ad[]>([])

const errorMessage = ref("")
const isLoading = ref(false)

function money(v: any) {
  const n = Number(v)
  if (Number.isNaN(n)) return "0.00"
  return n.toFixed(2)
}

async function loadProfile() {
  errorMessage.value = ""
  isLoading.value = true

  const token = getAuthToken()
  if (!token) {
    errorMessage.value = "Nicht eingeloggt."
    isLoading.value = false
    return
  }

  try {
    const res = await fetch(`${backendBaseUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      errorMessage.value = "Profil konnte nicht geladen werden."
      return
    }

    const data = await res.json()

    email.value = data.email || ""
    totalAds.value = data.totalAds || 0

    soldCount.value = data.soldCount || 0
    revenueTotal.value = money(data.revenueTotal)

    boughtCount.value = data.boughtCount || 0
    spentTotal.value = money(data.spentTotal)

    soldAds.value = data.soldAds || []
    boughtAds.value = data.boughtAds || []
  } catch (e) {
    errorMessage.value = "Server nicht erreichbar."
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="page">
    <div class="inner">
      <header class="header">
        <div>
          <h1 class="headline">Profil</h1>
          <p class="subtext">Übersicht über dein Konto</p>
        </div>

        <button class="ghost-button" type="button" @click="loadProfile" :disabled="isLoading">
          {{ isLoading ? "Lade..." : "Neu laden" }}
        </button>
      </header>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <section class="card">
        <h2 class="section-title">Account</h2>
        <p class="line"><span>E Mail:</span> {{ email }}</p>
        <p class="line"><span>Erstellte Anzeigen:</span> {{ totalAds }}</p>
      </section>

      <section class="stats">
        <div class="stat-card">
          <p class="stat-label">Verkäufe</p>
          <p class="stat-value">{{ soldCount }}</p>
          <p class="stat-sub">Einnahmen: {{ revenueTotal }} €</p>
        </div>

        <div class="stat-card">
          <p class="stat-label">Käufe</p>
          <p class="stat-value">{{ boughtCount }}</p>
          <p class="stat-sub">Ausgaben: {{ spentTotal }} €</p>
        </div>
      </section>

      <section class="card">
        <h2 class="section-title">Verkaufte Anzeigen</h2>
        <p v-if="soldAds.length === 0" class="empty-text">Noch keine Verkäufe.</p>

        <div v-else class="list">
          <article v-for="a in soldAds" :key="a.id" class="item">
            <img v-if="a.imagePath" :src="backendBaseUrl + a.imagePath" class="img" alt="Bild" />
            <div class="meta">
              <p class="title">{{ a.brand }}</p>
              <p class="small">Größe {{ a.size }} · {{ a.price }} €</p>
            </div>
          </article>
        </div>
      </section>

      <section class="card">
        <h2 class="section-title">Gekaufte Anzeigen</h2>
        <p v-if="boughtAds.length === 0" class="empty-text">Noch keine Käufe.</p>

        <div v-else class="list">
          <article v-for="a in boughtAds" :key="a.id" class="item">
            <img v-if="a.imagePath" :src="backendBaseUrl + a.imagePath" class="img" alt="Bild" />
            <div class="meta">
              <p class="title">{{ a.brand }}</p>
              <p class="small">Größe {{ a.size }} · {{ a.price }} €</p>
            </div>
          </article>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 40px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.inner {
  width: 100%;
  max-width: 1100px;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 40px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.headline {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 800;
  color: #111827;
}

.subtext {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 600;
}

.card {
  border-radius: 18px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
  margin-top: 16px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 850;
  color: #111827;
}

.line {
  margin: 6px 0;
  color: #111827;
  font-size: 14px;
}

.line span {
  font-weight: 800;
  color: #374151;
}

.stats {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  border-radius: 18px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
}

.stat-label {
  margin: 0;
  color: #6b7280;
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.stat-value {
  margin: 6px 0 0;
  font-size: 28px;
  font-weight: 900;
  color: #111827;
}

.stat-sub {
  margin: 6px 0 0;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 14px;
  padding: 10px;
}

.img {
  width: 84px;
  height: 64px;
  object-fit: cover;
  border-radius: 12px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  margin: 0;
  font-weight: 900;
  color: #111827;
}

.small {
  margin: 0;
  color: #6b7280;
  font-weight: 700;
  font-size: 13px;
}

.ghost-button {
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  background: #ffffff;
  color: #111827;
  font-weight: 800;
  font-size: 14px;
}

.empty-text {
  color: #6b7280;
  font-weight: 700;
  margin: 0;
}

.error-text {
  color: #dc2626;
  font-weight: 700;
  margin: 0;
}

@media (max-width: 860px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
