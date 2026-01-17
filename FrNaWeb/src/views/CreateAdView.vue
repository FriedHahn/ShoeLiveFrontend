<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { createAd, uploadAdImage } from "@/services/adService"

const brand = ref("")
const size = ref<number | null>(null)
const price = ref<string>("")

const imageFile = ref<File | null>(null)

const errorMessage = ref("")
const isSaving = ref(false)

const router = useRouter()

function onImageChange(e: Event) {
  const input = e.target as HTMLInputElement | null
  imageFile.value = input?.files?.[0] ?? null
}

function normalizedPrice() {
  return price.value.replace(",", ".").trim()
}

function isValid() {
  if (!brand.value.trim()) return false
  if (size.value === null || Number.isNaN(size.value) || size.value <= 0) return false

  const p = normalizedPrice()
  if (!p) return false
  if (Number.isNaN(Number(p)) || Number(p) < 0) return false

  return true
}

async function addItem() {
  errorMessage.value = ""

  if (!isValid()) {
    errorMessage.value = "Bitte Marke, Größe und Preis korrekt eingeben."
    return
  }

  isSaving.value = true
  try {
    const createdAd = await createAd({
      brand: brand.value,
      size: String(size.value),
      price: normalizedPrice()
    })

    if (imageFile.value) {
      await uploadAdImage(createdAd.id, imageFile.value)
    }

    router.push({ name: "ads" })
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : "Server nicht erreichbar."
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="create-container">
    <div class="create-card">
      <h1 class="headline">Anzeige erstellen</h1>
      <p class="subtext">Bitte gib die Daten ein.</p>

      <div class="form">
        <label class="label">
          Marke
          <input v-model="brand" class="input" type="text" placeholder="z.B. Nike" />
        </label>

        <label class="label">
          Größe
          <input
            v-model.number="size"
            class="input"
            type="number"
            inputmode="numeric"
            min="1"
            step="1"
            placeholder="z.B. 42"
          />
        </label>

        <label class="label">
          Preis
          <input
            v-model="price"
            class="input"
            type="text"
            inputmode="decimal"
            placeholder="z.B. 12.50 oder 12,50"
          />
        </label>

        <label class="label">
          Bild (optional)
          <input class="file" type="file" accept="image/*" @change="onImageChange" />
        </label>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <button class="save-button" type="button" @click="addItem" :disabled="isSaving">
          {{ isSaving ? "Speichern..." : "Anzeige speichern" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-container {
  min-height: 100vh;
  padding: 40px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.create-card {
  width: 100%;
  max-width: 800px;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 40px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}

.headline {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 800;
  color: #111827;
}

.subtext {
  margin: 0 0 18px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  outline: none;
}

.input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

.file {
  padding: 10px 0;
}

.error-text {
  color: #dc2626;
  font-weight: 650;
  margin: 0;
}

.save-button {
  margin-top: 6px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #ffffff;
  font-weight: 800;
  font-size: 16px;
  box-shadow: 0 14px 35px rgba(79, 70, 229, 0.6);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.save-button:hover:enabled {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px rgba(79, 70, 229, 0.7);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: default;
}
</style>
