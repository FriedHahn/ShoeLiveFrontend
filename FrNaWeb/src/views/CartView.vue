<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { getCartItems, removeFromCart, clearCart } from "@/stores/cart"
import { getAuthToken } from "@/stores/auth"
import KeinBild from "@/assets/KeinBild.png"

const router = useRouter()
const confirmBuy = ref(false)
const errorMessage = ref("")
const isBuying = ref(false)

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL

const items = computed(() => getCartItems())
const total = computed(() => items.value.reduce((sum, x) => sum + Number(x.price || 0), 0))

function getImageSrc(imagePath?: string | null) {
  if (imagePath && imagePath.trim()) return backendBaseUrl + imagePath
  return KeinBild
}

async function checkout() {
  errorMessage.value = ""
  if (!confirmBuy.value) {
    errorMessage.value = "Bitte zuerst bestätigen."
    return
  }
  if (items.value.length === 0) {
    errorMessage.value = "Warenkorb ist leer."
    return
  }

  const token = getAuthToken()
  if (!token) {
    errorMessage.value = "Nicht eingeloggt."
    return
  }

  isBuying.value = true
  try {
    const res = await fetch(`${backendBaseUrl}/api/purchases/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ adIds: items.value.map(i => i.id) })
    })

    if (!res.ok) {
      const msg = await res.text()
      errorMessage.value = msg || "Kauf fehlgeschlagen."
      return
    }

    clearCart()
    router.push({ name: "ads" })
  } catch {
    errorMessage.value = "Server nicht erreichbar."
  } finally {
    isBuying.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="inner">
      <header class="header">
        <div>
          <h1 class="headline">Warenkorb</h1>
          <p class="subtext">Hier kannst du den Kauf bestaetigen.</p>
        </div>
      </header>

      <p v-if="items.length === 0" class="empty-text">Dein Warenkorb ist leer.</p>

      <div v-else class="cart-list">
        <article v-for="it in items" :key="it.id" class="card">
          <div class="card-row">
            <div class="img-box">
              <img :src="getImageSrc(it.imagePath)" class="img" alt="Anzeigenbild" />
            </div>

            <div class="info">
              <h3 class="title">{{ it.brand }}</h3>
              <p class="line"><span>Groesse:</span> {{ it.size }}</p>
              <p class="line"><span>Preis:</span> {{ it.price }} €</p>
              <p class="small"><span>Verkaeufer:</span> {{ it.ownerEmail }}</p>
            </div>

            <div class="right">
              <button class="remove-btn" type="button" @click="removeFromCart(it.id)">
                Entfernen
              </button>
            </div>
          </div>
        </article>

        <div class="summary">
          <p class="sum"><span>Summe:</span> {{ total.toFixed(2) }} €</p>

          <label class="confirm">
            <input type="checkbox" v-model="confirmBuy" />
            Ich moechte diese Artikel kaufen.
          </label>

          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

          <button class="primary-button" type="button" @click="checkout" :disabled="isBuying">
            {{ isBuying ? "Kaufe..." : "Kaufen" }}
          </button>
        </div>
      </div>
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

.empty-text {
  color: #6b7280;
  font-weight: 700;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border-radius: 18px;
  padding: 16px 18px;
  background: #ffffff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
}

.card-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.img-box {
  width: 120px;
  height: 84px;
  border-radius: 14px;
  border: 1px solid rgba(17, 24, 39, 0.10);
  background: rgba(17, 24, 39, 0.03);
  overflow: hidden;
  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 6px;
  box-sizing: border-box;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 10px;
}

.info {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #111827;
}

.line {
  margin: 0;
  font-size: 14px;
  color: #111827;
}

.line span {
  font-weight: 800;
  color: #374151;
}

.small {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.remove-btn {
  width: 140px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  background: #ffffff;
  color: #111827;
  font-weight: 900;
  font-size: 14px;
  text-align: center;
}

.summary {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sum {
  margin: 0;
  font-weight: 900;
  color: #111827;
}

.confirm {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 750;
  color: #111827;
}

.primary-button {
  padding: 12px 14px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #ffffff;
  font-weight: 900;
  font-size: 14px;
  box-shadow: 0 14px 35px rgba(79, 70, 229, 0.55);
}

.primary-button:disabled {
  opacity: 0.7;
  cursor: default;
}

.error-text {
  color: #dc2626;
  font-weight: 750;
  margin: 0;
}

@media (max-width: 860px) {
  .card-row {
    flex-direction: column;
    align-items: stretch;
  }
  .img-box {
    width: 100%;
    height: 180px;
  }
  .right {
    justify-content: stretch;
  }
  .remove-btn {
    width: 100%;
  }
}
</style>
