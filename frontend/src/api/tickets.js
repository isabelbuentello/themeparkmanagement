import { ticketProducts } from '../data/tickets'
import { withMockDelay } from './mockDelay'

export async function getTicketProducts() {
  return withMockDelay(ticketProducts)
}

export function findTicketProductById(productId) {
  return ticketProducts.find((product) => product.id === productId) ?? null
}
