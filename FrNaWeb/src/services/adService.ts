import { getBackendBaseUrl, authHeaders, jsonHeaders } from "@/services/apiClient"

export type Ad = {
  id: number
  brand: string
  size: string
  price: string
  ownerEmail: string
  imagePath?: string | null
  sold?: boolean
  buyerEmail?: string | null
}

export type CreateAdPayload = {
  brand: string
  size: string
  price: string
}

export type UpdateAdPayload = {
  brand: string
  size: string
  price: string
}

export async function listAds(): Promise<Ad[]> {
  const res = await fetch(`${getBackendBaseUrl()}/api/ads`, {
    method: "GET",
    headers: { Accept: "application/json" }
  })

  if (!res.ok) {
    throw new Error(`Anzeigen konnten nicht geladen werden (Status ${res.status}).`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : (data ? [data] : [])
}

export async function createAd(payload: CreateAdPayload): Promise<Ad> {
  const res = await fetch(`${getBackendBaseUrl()}/api/ads`, {
    method: "POST",
    headers: {
      ...jsonHeaders(),
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Speichern fehlgeschlagen.")
  }

  return await res.json()
}

export async function updateAd(adId: number, payload: UpdateAdPayload): Promise<void> {
  const res = await fetch(`${getBackendBaseUrl()}/api/ads/${adId}`, {
    method: "PUT",
    headers: {
      ...jsonHeaders(),
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Speichern fehlgeschlagen.")
  }
}

export async function deleteAd(adId: number): Promise<void> {
  const res = await fetch(`${getBackendBaseUrl()}/api/ads/${adId}`, {
    method: "DELETE",
    headers: authHeaders()
  })

  if (!res.ok && res.status !== 204) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Löschen fehlgeschlagen.")
  }
}

export async function uploadAdImage(adId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${getBackendBaseUrl()}/api/ads/${adId}/image`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Bild Upload fehlgeschlagen.")
  }
}

export async function deleteAdImage(adId: number): Promise<void> {
  const res = await fetch(`${getBackendBaseUrl()}/api/ads/${adId}/image`, {
    method: "DELETE",
    headers: authHeaders()
  })

  if (!res.ok && res.status !== 204) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Bild löschen fehlgeschlagen.")
  }
}

export function buildImageUrl(imagePath: string | null | undefined): string {
  const p = (imagePath || "").trim()
  if (!p) return ""
  if (p.startsWith("http://") || p.startsWith("https://")) return p
  const path = p.startsWith("/") ? p : `/${p}`
  return `${getBackendBaseUrl()}${path}`
}
