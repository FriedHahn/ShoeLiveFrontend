import { ref, computed, watch } from "vue"

export type CartItem = {
  id: number
  brand: string
  size: string
  price: string
  ownerEmail: string
  imagePath?: string | null
}

const stored = localStorage.getItem("cart")
const cart = ref<CartItem[]>(stored ? JSON.parse(stored) : [])

watch(cart, (v) => {
  localStorage.setItem("cart", JSON.stringify(v))
}, { deep: true })

export const cartCount = computed(() => cart.value.length)

export function getCartItems() {
  return cart.value
}

export function addToCart(item: CartItem) {
  if (cart.value.some(x => x.id === item.id)) return
  cart.value.push(item)
}

export function removeFromCart(id: number) {
  cart.value = cart.value.filter(x => x.id !== id)
}

export function clearCart() {
  cart.value = []
}
