import { directories } from '../data/directories'
import { withMockDelay } from './mockDelay'

export async function getDirectory(category) {
  return withMockDelay(directories[category] ?? null)
}

export async function getVenueById(category, itemId) {
  const directory = directories[category]
  const item = directory?.items.find((entry) => entry.id === itemId) ?? null

  return withMockDelay({
    config: directory ?? null,
    item
  })
}
