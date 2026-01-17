import { getBackendBaseUrl, authHeaders } from "@/services/apiClient"

export async function fetchProfile() {
  const res = await fetch(`${getBackendBaseUrl()}/api/profile`, {
    method: "GET",
    headers: authHeaders()
  })

  if (!res.ok) {
    throw new Error("Profil konnte nicht geladen werden")
  }

  return await res.json()
}
