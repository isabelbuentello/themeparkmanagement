import { memberships as fallbackMemberships } from '../data/memberships'

const MEMBERSHIP_UI = {
  gold: {
    visitProfile: 'Occasional visits',
    spotlight: 'A lighter membership for guests who want a few extra perks during the year.'
  },
  silver: {
    visitProfile: 'Frequent visits',
    spotlight: 'A balanced option for regular guests who want stronger savings and repeat-visit value.'
  },
  platinum: {
    visitProfile: 'Unlimited park days',
    spotlight: 'The highest tier for guests who want the strongest benefits and premium flexibility.'
  }
}

function formatMembership(tier) {
  const tierName = tier.tier_name.toLowerCase()
  const ui = MEMBERSHIP_UI[tierName] || {
    visitProfile: 'Membership plan',
    spotlight: `${tier.tier_name} membership`
  }

  return {
    id: String(tier.id),
    name: tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1),
    visitProfile: ui.visitProfile,
    spotlight: ui.spotlight,
    price: `$${Number(tier.price).toFixed(2)}/month`,
    annualValue: `${tier.discount}% member discount`,
    perks: tier.perks
  }
}

export async function getMemberships() {
  const response = await fetch('/api/memberships')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load memberships')
  }

  return data.map(formatMembership)
}

export function findMembershipById(membershipId) {
  return fallbackMemberships.find((membership) => membership.id === membershipId) ?? null
}
