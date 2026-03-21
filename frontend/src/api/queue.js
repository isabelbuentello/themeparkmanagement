import { attractions } from '../data/queue'
import { withMockDelay } from './mockDelay'

export async function getQueueAttractions() {
  return withMockDelay(attractions)
}

export async function createQueueEntry(attraction) {
  return withMockDelay({
    attractionId: attraction.id,
    attractionName: attraction.name,
    location: attraction.location,
    returnWindow: attraction.returnWindow,
    joinedAt: new Date().toISOString()
  })
}

export async function cancelQueueEntry() {
  return withMockDelay(true)
}
