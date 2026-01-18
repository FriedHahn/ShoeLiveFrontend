import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mount } from "@vue/test-utils"
import type { Router } from "vue-router"
import { nextTick } from "vue"

function flushPromises() {
  return new Promise<void>((resolve) => queueMicrotask(resolve))
}

async function waitForRouteName(router: Router, expected: string) {
  for (let i = 0; i < 40; i++) {
    if (router.currentRoute.value?.name === expected) return
    await flushPromises()
  }
  expect(router.currentRoute.value?.name).toBe(expected)
}

async function waitUntil(condition: () => boolean, maxTicks = 40) {
  for (let i = 0; i < maxTicks; i++) {
    if (condition()) return
    await flushPromises()
  }
  expect(condition()).toBe(true)
}

function setBackendBaseUrl(value: string) {
  const meta = import.meta as unknown as { env: Record<string, unknown> }
  meta.env.VITE_BACKEND_BASE_URL = value
}

type FetchCall = [RequestInfo | URL, RequestInit?]

beforeEach(() => {
  vi.restoreAllMocks()
  vi.useFakeTimers()

  vi.resetModules()
  localStorage.clear()

  setBackendBaseUrl("")

  ;(globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn() as unknown as typeof fetch

  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
      window.setTimeout(() => cb(performance.now()), 0) as unknown as number
  }
  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = (id: number) => window.clearTimeout(id)
  }
})

afterEach(() => {
  vi.useRealTimers()
})

describe("Frontend: Tests für alle sinnvollen Methoden/Flows", () => {
  it("auth: login() setzt Zustand + localStorage, getter liefern Werte, isLoggedIn true", async () => {
    const auth = await import("@/stores/auth")

    expect(auth.isLoggedIn.value).toBe(false)

    auth.login("t-123", "test@example.com")

    expect(auth.isLoggedIn.value).toBe(true)
    expect(auth.getAuthToken()).toBe("t-123")
    expect(auth.getUserEmail()).toBe("test@example.com")
    expect(localStorage.getItem("token")).toBe("t-123")
    expect(localStorage.getItem("email")).toBe("test@example.com")
    expect(localStorage.getItem("loggedIn")).toBe("true")
  })

  it("auth: logout() räumt alles auf, isLoggedIn false", async () => {
    const auth = await import("@/stores/auth")

    auth.login("t-xyz", "me@example.com")
    expect(auth.isLoggedIn.value).toBe(true)

    auth.logout()

    expect(auth.isLoggedIn.value).toBe(false)
    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("email")).toBeNull()
    expect(localStorage.getItem("loggedIn")).toBeNull()
  })

  it("cart: addToCart verhindert Duplikate + cartCount + Persistenz", async () => {
    const cart = await import("@/stores/cart")

    cart.addToCart({ id: 1, brand: "Nike", size: "42", price: "10", ownerEmail: "a@a.de", imagePath: null })
    cart.addToCart({ id: 1, brand: "Nike", size: "42", price: "10", ownerEmail: "a@a.de", imagePath: null })

    expect(cart.cartCount.value).toBe(1)

    await flushPromises()
    const stored = JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ id: number }>
    expect(stored).toHaveLength(1)
    expect(stored[0]!.id).toBe(1)
  })

  it("cart: removeFromCart entfernt item + Persistenz passt", async () => {
    const cart = await import("@/stores/cart")

    cart.addToCart({ id: 10, brand: "A", size: "43", price: "20", ownerEmail: "x@x.de", imagePath: null })
    cart.addToCart({ id: 11, brand: "B", size: "44", price: "30", ownerEmail: "y@y.de", imagePath: null })
    expect(cart.cartCount.value).toBe(2)

    cart.removeFromCart(10)
    expect(cart.getCartItems().map((x) => x.id)).toEqual([11])

    await flushPromises()
    const stored = JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ id: number }>
    expect(stored.map((x) => x.id)).toEqual([11])
  })

  it("cart: clearCart leert alles + getCartItems leer", async () => {
    const cart = await import("@/stores/cart")

    cart.addToCart({ id: 20, brand: "C", size: "42", price: "99", ownerEmail: "z@z.de", imagePath: null })
    expect(cart.getCartItems()).toHaveLength(1)

    cart.clearCart()
    expect(cart.getCartItems()).toEqual([])
    expect(cart.cartCount.value).toBe(0)

    await flushPromises()
    expect(JSON.parse(localStorage.getItem("cart") || "[]")).toEqual([])
  })

  it("router guard: ausgeloggt -> /home wird login", async () => {
    const auth = await import("@/stores/auth")
    auth.logout()

    const router = (await import("@/router")).default as Router

    await router.push("/home")
    await router.isReady()

    await waitForRouteName(router, "login")
  })

  it("router guard: eingeloggt -> / und /register werden home", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const router = (await import("@/router")).default as Router

    await router.push("/")
    await router.isReady()
    await waitForRouteName(router, "home")

    await router.push("/register")
    await router.isReady()
    await waitForRouteName(router, "home")
  })

  it("App: Topbar sichtbar wenn token existiert (eingeloggt)", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const router = (await import("@/router")).default as Router
    const App = (await import("@/App.vue")).default

    await router.push("/home")
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.find("header.topbar").exists()).toBe(true)
  })

  it("App: Logout Button -> logout + Navigation login + Topbar weg", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const router = (await import("@/router")).default as Router
    const App = (await import("@/App.vue")).default

    await router.push("/home")
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find("button.logout").trigger("click")
    await flushPromises()

    await waitForRouteName(router, "login")
    expect(wrapper.find("header.topbar").exists()).toBe(false)
    expect(localStorage.getItem("token")).toBeNull()
  })

  it("App: Notifications (GET unread, toggle popup, click outside, POST read, refresh + interval)", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    type NotificationItem = { id: number; message: string }
    let current: NotificationItem[] = [
      { id: 1, message: "A" },
      { id: 2, message: "B" },
    ]

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)

        if (u.includes("/api/notifications") && (!init || init.method !== "POST")) {
          return new Response(JSON.stringify(current), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }

        if (u.includes("/api/notifications/") && init?.method === "POST") {
          const m = u.match(/\/api\/notifications\/(\d+)\/read/)
          const id = m ? Number(m[1]) : NaN
          if (!Number.isNaN(id)) current = current.filter((n) => n.id !== id)
          return new Response(null, { status: 200 })
        }

        return new Response(null, { status: 404 })
      })

    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const App = (await import("@/App.vue")).default

    await router.push("/home")
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    const bell = wrapper.find('[aria-label="Benachrichtigungen"]')
    expect(bell.exists()).toBe(true)

    await bell.trigger("click")
    await flushPromises()

    expect(wrapper.find(".popup").exists()).toBe(true)

    const readBtn = wrapper.find(".popup .notif-row .notif-btn")
    expect(readBtn.exists()).toBe(true)
    await readBtn.trigger("click")
    await flushPromises()

    await waitUntil(() => wrapper.find(".popup").exists(), 10)
    await waitUntil(() => wrapper.findAll(".notif-row").length === 1, 40)
    expect(wrapper.findAll(".notif-row")).toHaveLength(1)

    window.dispatchEvent(new Event("click"))
    await flushPromises()
    expect(wrapper.find(".popup").exists()).toBe(false)

    vi.advanceTimersByTime(8000)
    await flushPromises()

    const calls = fetchMock.mock.calls as unknown as FetchCall[]
    expect(calls.some((c) => String(c[0]).includes("/api/notifications"))).toBe(true)
  })

  it("LoginView: success -> speichert token + navigiert home", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)
        if (u.includes("/api/login") && init?.method === "POST") {
          return new Response(JSON.stringify({ success: true, token: "t-login" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(null, { status: 404 })
      })
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const LoginView = (await import("@/views/LoginView.vue")).default

    await router.push("/")
    await router.isReady()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await flushPromises()

    const inputs = wrapper.findAll("input.login-input")
    await inputs[0]!.setValue("me@example.com")
    await inputs[1]!.setValue("pw")

    await wrapper.find("button.login-button").trigger("click")
    await flushPromises()

    await waitForRouteName(router, "home")
    expect(localStorage.getItem("token")).toBe("t-login")
    expect(localStorage.getItem("email")).toBe("me@example.com")
  })

  it("LoginView: failure -> zeigt Fehlermeldung", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)
        if (u.includes("/api/login") && init?.method === "POST") {
          return new Response(JSON.stringify({ success: false, message: "Falsche Daten" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(null, { status: 404 })
      })

    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const LoginView = (await import("@/views/LoginView.vue")).default

    await router.push("/")
    await router.isReady()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await flushPromises()

    const inputs = wrapper.findAll("input.login-input")
    await inputs[0]!.setValue("me@example.com")
    await inputs[1]!.setValue("wrong")

    await wrapper.find("button.login-button").trigger("click")
    await flushPromises()
    await nextTick()

    await waitUntil(() => wrapper.find("p.login-error").exists(), 60)

    const err = wrapper.find("p.login-error")
    expect(err.text()).toContain("Falsche Daten")
  })

  it("RegisterView: success -> speichert token + navigiert home", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)
        if (u.includes("/api/register") && init?.method === "POST") {
          return new Response(JSON.stringify({ success: true, token: "t-reg" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(null, { status: 404 })
      })
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const RegisterView = (await import("@/views/RegisterView.vue")).default

    await router.push("/register")
    await router.isReady()

    const wrapper = mount(RegisterView, { global: { plugins: [router] } })
    await flushPromises()

    const inputs = wrapper.findAll("input.login-input")
    await inputs[0]!.setValue("new@example.com")
    await inputs[1]!.setValue("pw")

    await wrapper.find("button.login-button").trigger("click")
    await flushPromises()

    await waitForRouteName(router, "home")
    expect(localStorage.getItem("token")).toBe("t-reg")
    expect(localStorage.getItem("email")).toBe("new@example.com")
  })

  it("CreateAdView: validation fail -> zeigt error-text", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const router = (await import("@/router")).default as Router
    const CreateAdView = (await import("@/views/CreateAdView.vue")).default

    await router.push("/ads/new")
    await router.isReady()

    const wrapper = mount(CreateAdView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find("button.save-button").trigger("click")
    await flushPromises()

    const err = wrapper.find("p.error-text")
    expect(err.exists()).toBe(true)
    expect(err.text()).toContain("Bitte Marke, Größe und Preis korrekt")
  })

  it("CreateAdView: success -> POST /api/ads und navigiert ads", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)
        if (u.includes("/api/ads") && init?.method === "POST" && !u.includes("/image")) {
          return new Response(JSON.stringify({ id: 55 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(null, { status: 404 })
      })
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const CreateAdView = (await import("@/views/CreateAdView.vue")).default

    await router.push("/ads/new")
    await router.isReady()

    const wrapper = mount(CreateAdView, { global: { plugins: [router] } })
    await flushPromises()

    const inputs = wrapper.findAll("input.input")
    await inputs[0]!.setValue("Nike")
    await inputs[1]!.setValue("42")
    await inputs[2]!.setValue("99.99")

    await wrapper.find("button.save-button").trigger("click")
    await flushPromises()

    await waitForRouteName(router, "ads")
  })

  it("AllAdsView: loadAds + buy -> cart bekommt Item + toast", async () => {
    localStorage.setItem("cart", JSON.stringify([]))

    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const adsPayload = [
      { id: 1, brand: "Mine", size: "42", price: "10", ownerEmail: "me@example.com", imagePath: null, sold: false },
      { id: 2, brand: "Other", size: "43", price: "20", ownerEmail: "other@example.com", imagePath: null, sold: false },
    ]

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)
        if (u.includes("/api/ads") && (!init || init.method === "GET")) {
          return new Response(JSON.stringify(adsPayload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        }
        return new Response(null, { status: 404 })
      })
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const AllAdsView = (await import("@/views/AllAdsView.vue")).default

    await router.push("/ads")
    await router.isReady()

    const wrapper = mount(AllAdsView, { global: { plugins: [router] } })

    await waitUntil(() => wrapper.findAll("button.primary-button.full").length > 0, 50)
    const buyButtons = wrapper.findAll("button.primary-button.full")
    expect(buyButtons.length).toBeGreaterThan(0)

    await buyButtons[0]!.trigger("click")
    await flushPromises()

    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ id: number }>
    expect(storedCart.some((x) => x.id === 2)).toBe(true)

    await waitUntil(() => {
      return wrapper.find(".toast-text").exists() || !!document.body.querySelector(".toast-text")
    }, 50)

    const toastInWrapper = wrapper.find(".toast-text")
    const toastText =
      toastInWrapper.exists()
        ? toastInWrapper.text()
        : (document.body.querySelector(".toast-text")?.textContent || "")

    expect(toastText).toContain("In den Warenkorb gelegt")
  })

  it("CartView: checkout ohne Bestätigung -> Fehlertext", async () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([{ id: 9, brand: "X", size: "42", price: "10.50", ownerEmail: "seller@x.de", imagePath: null }])
    )

    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const router = (await import("@/router")).default as Router
    const CartView = (await import("@/views/CartView.vue")).default

    await router.push("/cart")
    await router.isReady()

    const wrapper = mount(CartView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find("button.primary-button").trigger("click")
    await flushPromises()

    const err = wrapper.find("p.error-text")
    expect(err.exists()).toBe(true)
    expect(err.text()).toContain("Bitte zuerst bestätigen")
  })

  it("CartView: checkout success -> POST + cart wird geleert + navigiert ads", async () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([{ id: 9, brand: "X", size: "42", price: "10.50", ownerEmail: "seller@x.de", imagePath: null }])
    )

    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const u = String(input)
        if (u.includes("/api/purchases/checkout") && init?.method === "POST") {
          return new Response(null, { status: 200 })
        }
        return new Response(null, { status: 404 })
      })
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const CartView = (await import("@/views/CartView.vue")).default

    await router.push("/cart")
    await router.isReady()

    const wrapper = mount(CartView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find("button.primary-button").trigger("click")
    await flushPromises()

    await waitForRouteName(router, "ads")
    expect(JSON.parse(localStorage.getItem("cart") || "[]")).toHaveLength(0)
  })

  it("ProfileView: loadProfile -> zeigt email (wartet bis DOM updated)", async () => {
    const auth = await import("@/stores/auth")
    auth.login("t-xyz", "me@example.com")

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const u = String(input)
        if (u.includes("/api/profile")) {
          return new Response(
            JSON.stringify({
              email: "me@example.com",
              totalAds: 3,
              soldCount: 1,
              revenueTotal: 10,
              boughtCount: 2,
              spentTotal: "25.5",
              soldAds: [],
              boughtAds: [],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        }
        return new Response(null, { status: 404 })
      })
    ;(globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const router = (await import("@/router")).default as Router
    const ProfileView = (await import("@/views/ProfileView.vue")).default

    await router.push("/profile")
    await router.isReady()

    const wrapper = mount(ProfileView, { global: { plugins: [router] } })

    await waitUntil(() => wrapper.text().includes("me@example.com"), 60)
    expect(wrapper.text()).toContain("me@example.com")
  })
})
