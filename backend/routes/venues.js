import express from 'express'
import db from '../db.js'

const router = express.Router()

const DIRECTORY_CONFIG = {
  dining: {
    title: 'Restaurants & Dining'
  },
  shops: {
    title: 'Shops & Park Finds'
  },
  shows: {
    title: 'Shows & Live Entertainment'
  }
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err)
        return
      }

      resolve(results)
    })
  })
}

function getDirectoryMeta(category) {
  return DIRECTORY_CONFIG[category] ?? null
}

function getPriceRangeLabel(value) {
  if (value <= 1) return '$'
  if (value === 2) return '$$'
  return '$$$'
}

async function getDiningItems() {
  const rows = await query(
    `
      SELECT
        v.venue_id,
        v.venue_name,
        v.hours,
        r.requires_booking,
        r.price_range,
        r.seating_capacity,
        mi.item_name,
        mi.price,
        mi.is_available
      FROM Venue v
      JOIN Restaurant r ON r.venue_id = v.venue_id
      LEFT JOIN MenuItem mi ON mi.restaurant_venue_id = r.venue_id
      WHERE v.venue_type = 'restaurant'
      ORDER BY v.venue_id, mi.item_name
    `
  )

  const byVenue = new Map()

  for (const row of rows) {
    if (!byVenue.has(row.venue_id)) {
      byVenue.set(row.venue_id, {
        id: String(row.venue_id),
        name: row.venue_name,
        type: row.requires_booking ? 'Sit-Down Dining' : 'Quick Service',
        location: `Venue ${row.venue_id}`,
        hours: row.hours,
        highlight: `${getPriceRangeLabel(row.price_range)} dining with seating for ${row.seating_capacity}`,
        description: row.requires_booking
          ? 'Table-service restaurant with scheduled seating and a fuller dining experience.'
          : 'Quick-service stop for guests who want food without a long sit-down experience.',
        details: [
          row.requires_booking ? 'Reservations are available for this location.' : 'No reservation is required for this location.',
          `Seating capacity: ${row.seating_capacity}`,
          `Price range: ${getPriceRangeLabel(row.price_range)}`
        ]
      })
    }

    if (row.item_name) {
      byVenue.get(row.venue_id).details.push(
        `${row.item_name} - $${Number(row.price).toFixed(2)}${row.is_available ? '' : ' (currently unavailable)'}`
      )
    }
  }

  return Array.from(byVenue.values())
}

async function getShopItems() {
  const rows = await query(
    `
      SELECT
        v.venue_id,
        v.venue_name,
        v.hours,
        s.space_for_items_sqft,
        s.total_merch_sold
      FROM Venue v
      JOIN Shop s ON s.venue_id = v.venue_id
      WHERE v.venue_type = 'shop'
      ORDER BY v.venue_name
    `
  )

  return rows.map((row) => ({
    id: String(row.venue_id),
    name: row.venue_name,
    type: 'Shop',
    location: `Venue ${row.venue_id}`,
    hours: row.hours,
    highlight: `${row.space_for_items_sqft} square feet of shopping space`,
    description: 'Browse park merchandise, practical items, and guest shopping essentials.',
    details: [
      `Floor space: ${row.space_for_items_sqft} sqft`,
      `Lifetime merchandise sold: ${row.total_merch_sold}`,
      `Open hours: ${row.hours}`
    ]
  }))
}

async function getShowItems() {
  const rows = await query(
    `
      SELECT
        v.venue_id,
        v.venue_name,
        v.hours,
        ps.show_id,
        ps.show_category,
        ps.duration,
        st.show_start_time
      FROM Venue v
      JOIN ParkShow ps ON ps.venue_id = v.venue_id
      LEFT JOIN ShowTime st ON st.show_id = ps.show_id
      WHERE v.venue_type = 'show'
      ORDER BY v.venue_id, st.show_start_time
    `
  )

  const byVenue = new Map()

  for (const row of rows) {
    if (!byVenue.has(row.venue_id)) {
      byVenue.set(row.venue_id, {
        id: String(row.venue_id),
        name: row.venue_name,
        type: row.show_category,
        location: `Venue ${row.venue_id}`,
        hours: row.hours,
        highlight: `${row.duration}-minute ${row.show_category} performance`,
        description: 'Live entertainment scheduled throughout the park day.',
        details: [
          `Show category: ${row.show_category}`,
          `Duration: ${row.duration} minutes`
        ]
      })
    }

    if (row.show_start_time) {
      byVenue.get(row.venue_id).details.push(
        `Showtime: ${new Date(row.show_start_time).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })}`
      )
    }
  }

  return Array.from(byVenue.values())
}

async function getItemsForCategory(category) {
  if (category === 'dining') return getDiningItems()
  if (category === 'shops') return getShopItems()
  if (category === 'shows') return getShowItems()
  return null
}

router.get('/:category', async (req, res) => {
  const meta = getDirectoryMeta(req.params.category)

  if (!meta) {
    return res.status(404).json({ message: 'Directory not found' })
  }

  try {
    const items = await getItemsForCategory(req.params.category)

    return res.json({
      ...meta,
      items
    })
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:category/:itemId', async (req, res) => {
  const meta = getDirectoryMeta(req.params.category)

  if (!meta) {
    return res.status(404).json({ message: 'Directory not found' })
  }

  try {
    const items = await getItemsForCategory(req.params.category)
    const item = items?.find((entry) => entry.id === req.params.itemId) ?? null

    return res.json({
      config: {
        ...meta,
        items: items ?? []
      },
      item
    })
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
