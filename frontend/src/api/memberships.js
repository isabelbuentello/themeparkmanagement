import { memberships } from '../data/memberships'
import { withMockDelay } from './mockDelay'

export async function getMemberships() {
  return withMockDelay(memberships)
}

export function findMembershipById(membershipId) {
  return memberships.find((membership) => membership.id === membershipId) ?? null
}
