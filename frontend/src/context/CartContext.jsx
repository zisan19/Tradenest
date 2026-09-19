import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

const LOCAL_STORAGE_KEY = 'tradenest_cart_items'

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [flyingItems, setFlyingItems] = useState([])
  const [cartBounce, setCartBounce] = useState(false)

  // Persist local cart changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e)
    }
  }, [items])

  // Sync cart with backend for authenticated users
  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      const res = await api.get('/api/cart/')
      if (res.data && Array.isArray(res.data.items)) {
        // Map backend CartItem model to frontend structure
        const formatted = res.data.items.map((it) => ({
          id: it.id,
          product_id: it.product_id,
          quantity: it.quantity,
          price_snapshot: it.price_snapshot,
          product: it.product,
        }))
        setItems(formatted)
      }
    } catch (err) {
      console.warn('Could not sync cart with backend:', err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      syncWithBackend()
    }
  }, [isAuthenticated, syncWithBackend])

  // Computed cart metrics
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.price_snapshot || item.product?.price || 0
      return sum + price * item.quantity
    }, 0)
  }, [items])

  // Trigger bounce on navbar cart icon
  const triggerCartBounce = useCallback(() => {
    setCartBounce(true)
    setTimeout(() => setCartBounce(false), 650)
  }, [])

  // Trigger flying thumbnail animation toward cart icon
  const triggerFlyToCart = useCallback(
    (product, originRect) => {
      if (!originRect) {
        triggerCartBounce()
        return
      }

      const cartBtn = document.getElementById('nav-cart-btn')
      if (!cartBtn) {
        triggerCartBounce()
        return
      }

      const targetRect = cartBtn.getBoundingClientRect()
      const flyingId = Date.now() + Math.random()

      const newFlyItem = {
        id: flyingId,
        imageUrl: product.image_url || '/placeholder.png',
        startX: originRect.left + originRect.width / 2,
        startY: originRect.top + originRect.height / 2,
        targetX: targetRect.left + targetRect.width / 2,
        targetY: targetRect.top + targetRect.height / 2,
      }

      setFlyingItems((prev) => [...prev, newFlyItem])

      // After flight animation completes (~750ms), remove item and bounce cart icon
      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((it) => it.id !== flyingId))
        triggerCartBounce()
      }, 750)
    },
    [triggerCartBounce]
  )

  // Add Item to Cart
  const addItem = useCallback(
    async (product, quantity, originRect = null) => {
      const moq = product.moq || 1
      const stock = product.stock || 9999
      const qty = Math.max(moq, Number(quantity) || moq)

      if (qty > stock) {
        toast.error(`Cannot add ${qty} units. Only ${stock} in stock.`)
        return false
      }

      // Optimistic local update
      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.product_id === product.id)
        if (existingIdx >= 0) {
          const updated = [...prev]
          const newQty = updated[existingIdx].quantity + qty
          if (newQty > stock) {
            toast.error(`Total quantity (${newQty}) exceeds available stock (${stock})`)
            return prev
          }
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: newQty,
            price_snapshot: product.price,
            product,
          }
          return updated
        } else {
          return [
            ...prev,
            {
              id: Date.now(),
              product_id: product.id,
              quantity: qty,
              price_snapshot: product.price,
              product,
            },
          ]
        }
      })

      // Trigger visual flight to navbar cart
      triggerFlyToCart(product, originRect)

      // Sync with backend if authenticated
      if (isAuthenticated) {
        try {
          const res = await api.post('/api/cart/items', {
            product_id: product.id,
            quantity: qty,
          })
          if (res.data && Array.isArray(res.data.items)) {
            setItems(res.data.items)
          }
        } catch (err) {
          console.warn('Backend cart add error:', err)
        }
      }

      return true
    },
    [isAuthenticated, triggerFlyToCart]
  )

  // Update Item Quantity
  const updateQuantity = useCallback(
    async (itemId, newQuantity) => {
      const item = items.find((it) => it.id === itemId || it.product_id === itemId)
      if (!item) return

      const product = item.product || {}
      const moq = product.moq || 1
      const stock = product.stock || 9999

      if (newQuantity < moq) {
        toast.error(`Minimum order quantity (MOQ) is ${moq} units.`)
        return
      }

      if (newQuantity > stock) {
        toast.error(`Cannot exceed available stock (${stock} units).`)
        return
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId || it.product_id === itemId
            ? { ...it, quantity: newQuantity }
            : it
        )
      )
      triggerCartBounce()

      // Backend sync
      if (isAuthenticated && typeof itemId === 'number' && itemId < 100000000000) {
        try {
          const res = await api.patch(`/api/cart/items/${itemId}`, {
            quantity: newQuantity,
          })
          if (res.data && Array.isArray(res.data.items)) {
            setItems(res.data.items)
          }
        } catch (err) {
          console.warn('Backend cart update error:', err)
        }
      }
    },
    [items, isAuthenticated, triggerCartBounce]
  )

  // Remove Item
  const removeItem = useCallback(
    async (itemId) => {
      setItems((prev) => prev.filter((it) => it.id !== itemId && it.product_id !== itemId))
      triggerCartBounce()

      if (isAuthenticated && typeof itemId === 'number' && itemId < 100000000000) {
        try {
          await api.delete(`/api/cart/items/${itemId}`)
        } catch (err) {
          console.warn('Backend cart delete error:', err)
        }
      }
    },
    [isAuthenticated, triggerCartBounce]
  )

  // Clear Cart
  const clearCart = useCallback(async () => {
    setItems([])
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    if (isAuthenticated) {
      try {
        await api.delete('/api/cart/')
      } catch (err) {
        console.warn('Backend cart clear error:', err)
      }
    }
  }, [isAuthenticated])

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen((prev) => !prev)

  const value = {
    items,
    isOpen,
    loading,
    totalItems,
    subtotal,
    cartBounce,
    flyingItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    syncWithBackend,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
