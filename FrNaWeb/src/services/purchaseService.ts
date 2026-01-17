import { getBackendBaseUrl, authHeaders, jsonHeaders } from "@/services/apiClient"

export async function checkoutPurchase(adIds: number[]): Promise<void> {
  const res = await fetch(`${getBackendBaseUrl()}/api/purchases/checkout`, {
    method: "POST",
    headers: {
      ...jsonHeaders(),
      ...authHeaders()
    },
    body: JSON.stringify({ adIds })
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(msg || "Kauf fehlgeschlagen.")
  }
}
