export async function submitPurchase(orderPayload) {
  const token = localStorage.getItem('token')

  const response = await fetch('/api/customer/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      cartItems: orderPayload.cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      visitDate: orderPayload.visitDate,
      paymentMethod: 'card'
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Purchase could not be completed')
  }

  return data
}
