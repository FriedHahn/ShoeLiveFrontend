import { getBackendBaseUrl } from "@/services/apiClient"

type AuthResult = {
  success: boolean
  token: string | null
  message?: string
}

async function postAuth(path: "/api/login" | "/api/register", email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${getBackendBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })

  const data = await res.json()

  if (res.ok && data.success) {
    return { success: true, token: data.token }
  }

  return {
    success: false,
    token: null,
    message: data?.message || (path === "/api/login" ? "Login fehlgeschlagen" : "Registrierung fehlgeschlagen")
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthResult> {
  return await postAuth("/api/login", email, password)
}

export async function registerRequest(email: string, password: string): Promise<AuthResult> {
  return await postAuth("/api/register", email, password)
}
