import { CustomerContext } from './customerContextInstance'
import { findMembershipById } from '../api/memberships'
import { cancelQueueEntry, createQueueEntry } from '../api/queue'
import { findTicketProductById } from '../api/tickets'
import usePersistentState from '../hooks/usePersistentState'

export function CustomerProvider({ children }) {
  const [cart, setCart] = usePersistentState('customer-cart', [])
  const [selectedMembershipId, setSelectedMembershipId] = usePersistentState(
    'selected-membership',
    'gold-pass'
  )
  const [activeQueueEntry, setActiveQueueEntry] = usePersistentState(
    'active-queue-entry',
    null
  )

  const addToCart = (productId) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === productId)

      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...currentCart, { productId, quantity: 1 }]
    })
  }

  const setMembershipInCart = (membershipId) => {
    setCart((currentCart) => {
      const nonMembershipItems = currentCart.filter(
        (item) => item.kind !== 'membership'
      )

      return [
        ...nonMembershipItems,
        { kind: 'membership', productId: membershipId, quantity: 1 }
      ]
    })
  }

  const updateCartQuantity = (productId, quantity, kind = 'ticket') => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId && (item.kind ?? 'ticket') === kind
            ? { ...item, quantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId, kind = 'ticket') => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(
            item.productId === productId &&
            (item.kind ?? 'ticket') === kind
          )
      )
    )
  }

  const clearCart = () => setCart([])

  const joinQueue = async (attraction) => {
    const queueEntry = await createQueueEntry(attraction)
    setActiveQueueEntry(queueEntry)
    return queueEntry
  }

  const leaveQueue = async () => {
    if (activeQueueEntry?.reservationId) {
      await cancelQueueEntry(activeQueueEntry.reservationId)
    }

    setActiveQueueEntry(null)
  }

  const cartItems = cart
    .map((item) => {
      const itemKind = item.kind ?? 'ticket'
      const product =
        itemKind === 'membership'
          ? findMembershipById(item.productId)
          : findTicketProductById(item.productId)

      if (!product) {
        return null
      }

      return {
        ...item,
        kind: itemKind,
        product,
        subtotal:
          itemKind === 'membership'
            ? Number(product.price.replace(/[^0-9.]/g, '')) * item.quantity
            : product.price * item.quantity
      }
    })
    .filter(Boolean)

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  const value = {
    activeQueueEntry,
    addToCart,
    cartCount,
    cartItems,
    cartSubtotal,
    clearCart,
    joinQueue,
    leaveQueue,
    removeFromCart,
    selectedMembershipId,
    setMembershipInCart,
    setSelectedMembershipId,
    updateCartQuantity
  }

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}
