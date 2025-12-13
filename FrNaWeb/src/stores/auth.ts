import { ref, computed } from "vue"

const token = ref<string | null>(localStorage.getItem("token"))
const email = ref<string | null>(localStorage.getItem("email"))

export const isLoggedIn = computed(() => !!token.value)

export function login(newToken: string, userEmail: string) {
  token.value = newToken
  email.value = userEmail

  localStorage.setItem("token", newToken)
  localStorage.setItem("email", userEmail)
  localStorage.setItem("loggedIn", "true")
}

export function logout() {
  token.value = null
  email.value = null

  localStorage.removeItem("token")
  localStorage.removeItem("email")
  localStorage.removeItem("loggedIn")
}

export function getAuthToken() {
  return token.value
}

export function getUserEmail() {
  return email.value
}
