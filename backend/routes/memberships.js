import express from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  db.query(
    `
      SELECT
        mt.tier_id,
        mt.tier_name,
        mt.discount,
        mt.price,
        p.perk_name
      FROM MembershipTier mt
      LEFT JOIN TierPerk tp ON tp.tier_id = mt.tier_id
      LEFT JOIN Perk p ON p.perk_id = tp.perk_id
      ORDER BY mt.tier_id, p.perk_name
    `,
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' })
      }

      const membershipsByTier = new Map()

      for (const row of results) {
        if (!membershipsByTier.has(row.tier_id)) {
          membershipsByTier.set(row.tier_id, {
            id: String(row.tier_id),
            tier_name: row.tier_name,
            discount: Number(row.discount),
            price: Number(row.price),
            perks: []
          })
        }

        if (row.perk_name) {
          membershipsByTier.get(row.tier_id).perks.push(row.perk_name)
        }
      }

      res.json(Array.from(membershipsByTier.values()))
    }
  )
})

export default router
