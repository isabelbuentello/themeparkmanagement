import { ticketProducts } from '../data/tickets'

export async function getTicketProducts() {
  const response = await fetch('/api/customer/tickets')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load ticket products')
  }

  return data
}

export function findTicketProductById(productId) {
  return ticketProducts.find((product) => product.id === productId) ?? null
}
