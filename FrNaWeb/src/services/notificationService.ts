import { getBackendBaseUrl, authHeaders } from "@/services/apiClient"

export type NotificationItem = {
  id: number
  message: string
}

export async function fetchUnreadNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${getBackendBaseUrl()}/api/notifications`, {
    headers: authHeaders()
  })

  if (!res.ok) return []

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function markNotificationRead(id: number): Promise<void> {
  await fetch(`${getBackendBaseUrl()}/api/notifications/${id}/read`, {
    method: "POST",
    headers: authHeaders()
  })
}
