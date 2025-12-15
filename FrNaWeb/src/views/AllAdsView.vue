<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue"
import { RouterLink } from "vue-router"
import { getAuthToken, getUserEmail } from "@/stores/auth"
import { addToCart } from "@/stores/cart"
import KeinBild from "@/assets/KeinBild.png"

type Ad = {
  id: number
  brand: string
  size: string
  price: string
  ownerEmail: string
  imagePath?: string | null
}

const ads = ref<Ad[]>([])
const errorMessage = ref("")
const isLoading = ref(false)

const backendBaseUrl = (import.meta.env.VITE_BACKEND_BASE_URL || "").replace(/\/+$/, "")
const myEmail = computed(() => (getUserEmail() || "").trim().toLowerCase())

const openMenuId = ref<number | null>(null)

const isEditOpen = ref(false)
const editId = ref<number | null>(null)
const editBrand = ref("")
const editSize = ref<number | null>(null)
const editPrice = ref<number | null>(null)
const editError = ref("")
const isSavingEdit = ref(false)

const editRemoveImage = ref(false)
const editImageFile = ref<File | null>(null)

function onEditImageChange(e: Event) {
  const input = e.target as HTMLInputElement | null
  editImageFile.value = input?.files?.[0] ?? null
}

const myAds = computed(() => ads.value.filter(a => (a.ownerEmail || "").trim().toLowerCase() === myEmail.value))
const otherAds = computed(() => ads.value.filter(a => (a.ownerEmail || "").trim().toLowerCase() !== myEmail.value))

function getImageSrc(ad: Ad) {
  const p = (ad.imagePath || "").trim()
  if (!p) return KeinBild

  if (p.startsWith("http://") || p.startsWith("https://")) return p

  const path = p.startsWith("/") ? p : `/${p}`
  return `${backendBaseUrl}${path}`
}

async function loadAds() {
  errorMessage.value = ""
  isLoading.value = true
  try {
    const res = await fetch(`${backendBaseUrl}/api/ads`)
    if (!res.ok) {
      errorMessage.value = `Anzeigen konnten nicht geladen werden (Status ${res.status}).`
      return
    }
    const data = await res.json()
    ads.value = Array.isArray(data) ? data : (data ? [data] : [])
  } catch {
    errorMessage.value = "Server nicht erreichbar."
  } finally {
    isLoading.value = false
  }
}

function toggleMenu(id: number) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function canEdit(ad: Ad) {
  return (ad.ownerEmail || "").toLowerCase() === myEmail.value
}

function openEdit(ad: Ad) {
  if (!canEdit(ad)) return
  openMenuId.value = null

  editError.value = ""
  editId.value = ad.id
  editBrand.value = ad.brand ?? ""
  editSize.value = Number(ad.size)
  editPrice.value = Number(ad.price)

  editRemoveImage.value = false
  editImageFile.value = null
  isEditOpen.value = true
}

function closeEdit() {
  isEditOpen.value = false
  editId.value = null
}

function isEditValid() {
  if (!editBrand.value.trim()) return false
  if (editSize.value === null || Number.isNaN(editSize.value) || editSize.value <= 0) return false
  if (editPrice.value === null || Number.isNaN(editPrice.value) || editPrice.value < 0) return false
  return true
}

async function saveEdit() {
  editError.value = ""
  if (!isEditValid() || editId.value === null) {
    editError.value = "Bitte Marke, Größe und Preis korrekt eingeben."
    return
  }

  const token = getAuthToken()
  if (!token) {
    editError.value = "Nicht eingeloggt."
    return
  }

  isSavingEdit.value = true
  try {
    const res = await fetch(`${backendBaseUrl}/api/ads/${editId.value}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        brand: editBrand.value,
        size: String(editSize.value),
        price: String(editPrice.value)
      })
    })

    if (!res.ok) {
      const msg = await res.text()
      editError.value = msg || "Speichern fehlgeschlagen."
      return
    }

    if (editRemoveImage.value) {
      await fetch(`${backendBaseUrl}/api/ads/${editId.value}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
    }

    if (editImageFile.value) {
      const formData = new FormData()
      formData.append("file", editImageFile.value)

      await fetch(`${backendBaseUrl}/api/ads/${editId.value}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
    }

    closeEdit()
    await loadAds()
  } catch {
    editError.value = "Server nicht erreichbar."
  } finally {
    isSavingEdit.value = false
  }
}

async function deleteAd(ad: Ad) {
  if (!canEdit(ad)) return
  openMenuId.value = null

  const ok = confirm("Anzeige wirklich löschen?")
  if (!ok) return

  const token = getAuthToken()
  if (!token) {
    errorMessage.value = "Nicht eingeloggt."
    return
  }

  try {
    const res = await fetch(`${backendBaseUrl}/api/ads/${ad.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok && res.status !== 204) {
      const msg = await res.text()
      errorMessage.value = msg || "Löschen fehlgeschlagen."
      return
    }

    await loadAds()
  } catch {
    errorMessage.value = "Server nicht erreichbar."
  }
}

function buy(ad: Ad) {
  addToCart({
    id: ad.id,
    brand: ad.brand,
    size: ad.size,
    price: ad.price,
    ownerEmail: ad.ownerEmail,
    imagePath: ad.imagePath ?? null
  })
  alert("In den Warenkorb gelegt.")
}

function closeMenu() {
  openMenuId.value = null
}

onMounted(() => {
  loadAds()
  window.addEventListener("click", closeMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener("click", closeMenu)
})
</script>

<template>
  <div class="ads-page">
    <div class="ads-inner">
      <header class="ads-header">
        <div>
          <h1 class="headline">Alle Anzeigen</h1>
          <p class="subtext">Alle Anzeigen sind öffentlich.</p>
        </div>

        <div class="actions">
          <button class="ghost-button" type="button" @click="loadAds" :disabled="isLoading">
            {{ isLoading ? "Lade..." : "Neu laden" }}
          </button>

          <RouterLink :to="{ name: 'cart' }" class="ghost-link">Warenkorb</RouterLink>
          <RouterLink :to="{ name: 'create-ad' }" class="primary-button">Anzeige erstellen</RouterLink>
        </div>
      </header>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <p v-else-if="ads.length === 0" class="empty-text">Es wurden noch keine Anzeigen erstellt.</p>

      <div v-else class="sections">
        <section class="section">
          <h2 class="section-title">Meine Anzeigen</h2>
          <p v-if="myAds.length === 0" class="empty-text">Du hast noch keine Anzeigen.</p>

          <div v-else class="ads-grid">
            <article v-for="ad in myAds" :key="ad.id" class="ad-card">
              <div class="img-frame">
                <img :src="getImageSrc(ad)" class="ad-image" alt="Anzeigenbild" />
              </div>

              <div class="content">
                <h3 class="ad-title">{{ ad.brand }}</h3>
                <p class="line"><span>Größe:</span> {{ ad.size }}</p>
                <p class="line"><span>Preis:</span> {{ ad.price }} €</p>
              </div>

              <div class="dots-wrap" @click.stop>
                <button class="dots-btn" type="button" @click="toggleMenu(ad.id)">⋯</button>

                <div v-if="openMenuId === ad.id" class="dots-menu">
                  <button type="button" class="menu-item" @click="openEdit(ad)">Bearbeiten</button>
                  <button type="button" class="menu-item danger" @click="deleteAd(ad)">Löschen</button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Anzeigen von anderen</h2>
          <p v-if="otherAds.length === 0" class="empty-text">Keine Anzeigen von anderen gefunden.</p>

          <div v-else class="ads-grid">
            <article v-for="ad in otherAds" :key="ad.id" class="ad-card">
              <div class="img-frame">
                <img :src="getImageSrc(ad)" class="ad-image" alt="Anzeigenbild" />
              </div>

              <div class="content">
                <h3 class="ad-title">{{ ad.brand }}</h3>
                <span class="owner-pill">von {{ ad.ownerEmail }}</span>
                <p class="line"><span>Größe:</span> {{ ad.size }}</p>
                <p class="line"><span>Preis:</span> {{ ad.price }} €</p>
              </div>

              <div class="bottom-row">
                <button class="primary-button full" type="button" @click="buy(ad)">Kaufen</button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <div v-if="isEditOpen" class="edit-backdrop" @click="closeEdit">
      <div class="edit-modal" @click.stop>
        <h2 class="edit-title">Anzeige bearbeiten</h2>

        <div class="edit-form">
          <label class="label">
            Marke
            <input v-model="editBrand" class="input" type="text" />
          </label>

          <label class="label">
            Größe
            <input v-model.number="editSize" class="input" type="number" inputmode="numeric" min="1" step="1" />
          </label>

          <label class="label">
            Preis
            <input v-model.number="editPrice" class="input" type="number" inputmode="decimal" min="0" step="0.01" />
          </label>

          <label class="label checkbox">
            <input type="checkbox" v-model="editRemoveImage" />
            Bild entfernen
          </label>

          <label class="label">
            Neues Bild hochladen
            <input class="file" type="file" accept="image/*" @change="onEditImageChange" />
          </label>

          <p v-if="editError" class="error-text">{{ editError }}</p>

          <div class="edit-actions">
            <button class="ghost-button" type="button" @click="closeEdit">Abbrechen</button>
            <button class="primary-button" type="button" @click="saveEdit" :disabled="isSavingEdit">
              {{ isSavingEdit ? "Speichern..." : "Speichern" }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.ads-page {
  min-height: 100vh;
  height: auto;
  padding: 40px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
  display: block;
}

.ads-inner {
  width: 100%;
  max-width: 1100px;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 40px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  margin: 0 auto;
}

.ads-header {
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
  max-width: 680px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.primary-button {
  padding: 12px 14px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #ffffff;
  font-weight: 800;
  font-size: 14px;
  text-decoration: none;
  box-shadow: 0 14px 35px rgba(79, 70, 229, 0.55);
}

.primary-button.full {
  width: 100%;
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

.ghost-link {
  padding: 12px 14px;
  border-radius: 14px;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  font-weight: 800;
  font-size: 14px;
  text-decoration: none;
}

.error-text {
  color: #dc2626;
  font-weight: 650;
  margin: 0;
}

.empty-text {
  color: #6b7280;
  font-weight: 600;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 850;
  color: #111827;
}

.ads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.ad-card {
  position: relative;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.img-frame {
  height: 165px;
  background: rgba(17, 24, 39, 0.03);
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-sizing: border-box;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.content {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
}

.ad-title {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #111827;
}

.owner-pill {
  display: inline-block;
  width: fit-content;
  font-size: 12px;
  font-weight: 850;
  color: #374151;
  background: rgba(17, 24, 39, 0.06);
  padding: 6px 10px;
  border-radius: 999px;
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

.bottom-row {
  padding: 12px 16px 16px;
}

.dots-wrap {
  position: absolute;
  right: 12px;
  bottom: 12px;
}

.dots-btn {
  width: 44px;
  height: 40px;
  border-radius: 14px;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  font-weight: 900;
  color: #111827;
  line-height: 1;
}

.dots-menu {
  position: absolute;
  right: 0;
  bottom: 52px;
  min-width: 170px;
  background: #ffffff;
  border: 1px solid rgba(17, 24, 39, 0.10);
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 9999;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: #ffffff;
  cursor: pointer;
  font-weight: 750;
  color: #111827;
}

.menu-item.danger {
  color: #dc2626;
}

.edit-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.50);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 20000;
}

.edit-modal {
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  border-radius: 22px;
  padding: 22px;
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.28);
}

.edit-title {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 850;
  color: #111827;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.label.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  outline: none;
}

.file {
  padding: 8px 0;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
</style>
