
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


// GET all venues with their type-specific info
router.get('/', (req, res) => {
  db.query(
    `SELECT v.*,
            s.space_for_items_sqft, s.total_merch_sold,
            r.requires_booking, r.price_range, r.seating_capacity,
            ps.show_category, ps.duration
     FROM Venue v
     LEFT JOIN Shop s ON v.venue_id = s.venue_id
     LEFT JOIN Restaurant r ON v.venue_id = r.venue_id
     LEFT JOIN ParkShow ps ON v.venue_id = ps.venue_id
     ORDER BY v.venue_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    }
  )
})

// GET venues for dropdowns (just id, name, type, coordinates)
router.get('/list', (req, res) => {
  db.query(
    'SELECT venue_id, venue_name, venue_type, venue_lat, venue_long FROM Venue ORDER BY venue_name',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows)
    }
  )
})

// GET venue by name (for forms that need to look up by name)
router.get('/name/:name', (req, res) => {
  db.query(
    'SELECT * FROM Venue WHERE venue_name = ?',
    [req.params.name],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      if (rows.length === 0) return res.status(404).json({ error: 'Venue not found' })
      res.json(rows[0])
    }
  )
})

// POST create venue
router.post('/', (req, res) => {
  const { venue_type, venue_name, hours, venue_lat, venue_long } = req.body

  db.query(
    'INSERT INTO Venue (venue_type, venue_name, hours, venue_lat, venue_long) VALUES (?, ?, ?, ?, ?)',
    [venue_type, venue_name, hours, venue_lat, venue_long],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message })

      const venueId = result.insertId

      if (venue_type === 'shop') {
        const { space_for_items_sqft } = req.body
        db.query(
          'INSERT INTO Shop (venue_id, space_for_items_sqft, total_merch_sold) VALUES (?, ?, 0)',
          [venueId, space_for_items_sqft || 0],
          (err) => {
            if (err) return res.status(500).json({ error: err.message })
            res.status(201).json({ venue_id: venueId })
          }
        )
      } else if (venue_type === 'restaurant') {
        const { requires_booking, price_range, seating_capacity } = req.body
        db.query(
          'INSERT INTO Restaurant (venue_id, requires_booking, price_range, seating_capacity) VALUES (?, ?, ?, ?)',
          [venueId, requires_booking || false, price_range || 1, seating_capacity || 0],
          (err) => {
            if (err) return res.status(500).json({ error: err.message })
            res.status(201).json({ venue_id: venueId })
          }
        )
      } else if (venue_type === 'show') {
        const { show_category, duration, show_lat, show_long } = req.body
        db.query(
          'INSERT INTO ParkShow (venue_id, show_lat, show_long, show_category, duration) VALUES (?, ?, ?, ?, ?)',
          [venueId, show_lat || venue_lat, show_long || venue_long, show_category || 'musician', duration || 30],
          (err) => {
            if (err) return res.status(500).json({ error: err.message })
            res.status(201).json({ venue_id: venueId })
          }
        )
      } else {
        res.status(201).json({ venue_id: venueId })
      }
    }
  )
})

// PUT update venue
router.put('/:id', (req, res) => {
  const { venue_name, hours, venue_lat, venue_long } = req.body

  db.query(
    'UPDATE Venue SET venue_name = ?, hours = ?, venue_lat = ?, venue_long = ? WHERE venue_id = ?',
    [venue_name, hours, venue_lat, venue_long, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: 'Venue updated' })
    }
  )
})

// DELETE venue
router.delete('/:id', (req, res) => {
  const venueId = req.params.id

  db.query('DELETE FROM Shop WHERE venue_id = ?', [venueId], () => {
    db.query('DELETE FROM Restaurant WHERE venue_id = ?', [venueId], () => {
      db.query('DELETE FROM ParkShow WHERE venue_id = ?', [venueId], () => {
        db.query('DELETE FROM Venue WHERE venue_id = ?', [venueId], (err) => {
          if (err) return res.status(500).json({ error: err.message })
          res.json({ message: 'Venue deleted' })
        })
      })
    })
  })
})

// GET directory by category (dining, shops, shows)
router.get('/directory/:category', async (req, res) => {
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

// GET single item from directory
router.get('/directory/:category/:itemId', async (req, res) => {
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

// GET single venue by ID (must be last to avoid conflicts)
router.get('/:id', (req, res) => {
  db.query(
    `SELECT v.*,
            s.space_for_items_sqft, s.total_merch_sold,
            r.requires_booking, r.price_range, r.seating_capacity,
            ps.show_category, ps.duration
     FROM Venue v
     LEFT JOIN Shop s ON v.venue_id = s.venue_id
     LEFT JOIN Restaurant r ON v.venue_id = r.venue_id
     LEFT JOIN ParkShow ps ON v.venue_id = ps.venue_id
     WHERE v.venue_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      if (rows.length === 0) return res.status(404).json({ error: 'Venue not found' })
      res.json(rows[0])
    }
  )
})

export default router
