<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { login as setLoginState } from "@/stores/auth"

const router = useRouter()
const email = ref("test@mail.de")
const password = ref("1234")
const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL
const errorMessage = ref("")

async function login() {
  errorMessage.value = ""

  const res = await fetch(`${backendBaseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.value, password: password.value })
  })

  const data = await res.json()

  if (res.ok && data.success) {
    setLoginState(data.token)
    router.push({ name: "home" })
  } else {
    errorMessage.value = data.message || "Login fehlgeschlagen"
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Linke Seite: Text / Branding -->
      <div class="login-left">
        <div class="login-logo">
          <span>FR</span>
        </div>
        <div class="login-headlines">
          <h1>Login</h1>
          <h2>Zugang zu deinem System</h2>
        </div>
        <p class="login-text">
          Melde dich an, um Zugriff auf dein Dashboard und deine Daten zu erhalten.
        </p>
      </div>

      <!-- Rechte Seite: Formular -->
      <div class="login-right">
        <div class="login-form-header">
          <h3>Anmelden</h3>
          <p>Bitte Zugangsdaten eingeben</p>
        </div>

        <div class="login-form">
          <label class="login-label">
            E-Mail
            <input
              v-model="email"
              type="email"
              class="login-input"
              placeholder="dein@mail.de"
            />
          </label>

          <label class="login-label">
            Passwort
            <input
              v-model="password"
              type="password"
              class="login-input"
              placeholder="••••••••"
            />
          </label>

          <p v-if="errorMessage" class="login-error">
            {{ errorMessage }}
          </p>

          <button class="login-button" @click="login">
            Einloggen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 40px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
}

.login-card {
  max-width: 1100px;
  width: 100%;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  padding: 48px 56px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 40px;
}

.login-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-logo {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 24px;
  color: #ffffff;
  box-shadow: 0 12px 30px rgba(79, 70, 229, 0.5);
}

.login-headlines h1 {
  margin: 0;
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  color: transparent;
}

.login-headlines h2 {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: #4b5563;
}

.login-text {
  margin: 16px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: #4b5563;
}

.login-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-form-header h3 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}

.login-form-header p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.login-input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.login-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
}

.login-error {
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
}

.login-button {
  margin-top: 8px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #ffffff;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 14px 35px rgba(79, 70, 229, 0.6);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px rgba(79, 70, 229, 0.7);
}
</style>
