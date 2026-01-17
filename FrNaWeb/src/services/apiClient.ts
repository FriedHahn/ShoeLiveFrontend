import { getAuthToken } from "@/stores/auth"

export function getBackendBaseUrl(): string {
  return (import.meta.env.VITE_BACKEND_BASE_URL as string).replace(/\/+$/, "")
}

export function requireToken(): string {
  const token = getAuthToken()
  if (!token) throw new Error("Nicht eingeloggt.")
  return token
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = requireToken()
  return { Authorization: `Bearer ${token}`, ...(extra || {}) }
}

export function jsonHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "Content-Type": "application/json", ...(extra || {}) }
}
