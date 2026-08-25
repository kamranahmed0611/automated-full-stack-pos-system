import { create } from 'zustand'

// ── Auth Store ──
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token') || null,

  login: (user, token) => {
    localStorage.setItem('pos_user', JSON.stringify(user))
    localStorage.setItem('pos_token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('pos_user')
    localStorage.removeItem('pos_token')
    set({ user: null, token: null })
  },
}))

// ── Cart Store ──
export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discountVal: 0,
  discountType: 'percent',
  taxRate: 17,
  paymentMethod: 'cash',
  notes: '',

  addItem: (product) => {
    const items = get().items
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      if (existing.qty >= product.stock) return false
      set({ items: items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) })
    } else {
      if (product.stock <= 0) return false
      set({ items: [...items, { ...product, qty: 1 }] })
    }
    return true
  },

  setQty: (id, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.id !== id) })
    } else {
      set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) })
    }
  },

  removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

  clearCart: () => set({ items: [], customer: null, discountVal: 0, notes: '' }),

  setCustomer: (c) => set({ customer: c }),
  setDiscount: (val, type) => set({ discountVal: val, discountType: type }),
  setTaxRate: (r) => set({ taxRate: r }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setNotes: (n) => set({ notes: n }),

  get totals() {
    const { items, discountVal, discountType, taxRate } = get()
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    const discAmt = discountType === 'flat'
      ? Math.min(discountVal, subtotal)
      : subtotal * discountVal / 100
    const taxable = subtotal - discAmt
    const taxAmt = taxable * taxRate / 100
    const grand = taxable + taxAmt
    return { subtotal, discAmt, taxAmt, grand, itemCount: items.reduce((s, i) => s + i.qty, 0) }
  }
}))
