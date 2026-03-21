import { withMockDelay } from './mockDelay'

export async function submitPurchase(orderPayload) {
  return withMockDelay({
    ok: true,
    confirmationId: `TPR-${Date.now()}`,
    order: orderPayload
  })
}
