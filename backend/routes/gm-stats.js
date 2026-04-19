import express from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()


function verifyToken(req, res, next) {
	const token = req.headers.authorization?.split(' ')[1]
	if (!token) return res.status(401).json({ message: 'No token provided' })

	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET)
		next()
	} catch {
		res.status(401).json({ message: 'Invalid token' })
	}
}

function requireGM(req, res, next) {
	if (req.user.role !== 'general_manager') {
		return res.status(403).json({ message: 'Access denied' })
	}
	next()
}

// PARK DAY

// POST /parkday — log a new park day
// attendance is auto-counted from Visit table
router.post('/parkday', verifyToken, requireGM, (req, res) => {
	const { park_date, rain, park_closed, weather_notes } = req.body

	if (!park_date || rain === undefined || park_closed === undefined) {
		return res.status(400).json({ message: 'park_date, rain, and park_closed are required' })
	}

	// count attendance from Visit entries for that date
	db.query(
		'SELECT COUNT(*) AS attendance FROM Visit WHERE visit_date = ?',
		[park_date],
		(err, rows) => {
			if (err) return res.status(500).json({ message: 'Server error' })

			const total_attendance = rows[0].attendance

			db.query(
				`INSERT INTO ParkDay (park_date, rain, park_closed, weather_notes, total_attendance, employees_expected)
				 VALUES (?, ?, ?, ?, ?, 0)`,
				[park_date, rain, park_closed, weather_notes || null, total_attendance],
				(err, result) => {
					if (err) {
						if (err.code === 'ER_DUP_ENTRY') {
							return res.status(400).json({ message: 'A park day already exists for this date' })
						}
						return res.status(500).json({ message: 'Error creating park day' })
					}
					res.status(201).json({
						message: 'Park day logged',
						day_id: result.insertId,
						total_attendance
					})
				}
			)
		}
	)
})

// PATCH /parkday/:id — update rain, park_closed, weather_notes
// re-calculates attendance from Visit table
router.patch('/parkday/:id', verifyToken, requireGM, (req, res) => {
	const { id } = req.params
	const { rain, park_closed, weather_notes } = req.body

	db.query('SELECT park_date FROM ParkDay WHERE day_id = ?', [id], (err, rows) => {
		if (err) return res.status(500).json({ message: 'Server error' })
		if (rows.length === 0) return res.status(404).json({ message: 'Park day not found' })

		const park_date = rows[0].park_date

		db.query('SELECT COUNT(*) AS attendance FROM Visit WHERE visit_date = ?', [park_date], (err, countRows) => {
			if (err) return res.status(500).json({ message: 'Server error' })

			const total_attendance = countRows[0].attendance

			db.query(
				`UPDATE ParkDay
				 SET rain = COALESCE(?, rain),
				     park_closed = COALESCE(?, park_closed),
				     weather_notes = COALESCE(?, weather_notes),
				     total_attendance = ?
				 WHERE day_id = ?`,
				[
					rain !== undefined ? rain : null,
					park_closed !== undefined ? park_closed : null,
					weather_notes !== undefined ? weather_notes : null,
					total_attendance,
					id
				],
				(err, result) => {
					if (err) return res.status(500).json({ message: 'Server error' })
					if (result.affectedRows === 0) return res.status(404).json({ message: 'Park day not found' })

					// query what the rain triggers just changed
					db.query(
						`SELECT ride_name, status_ride FROM Ride WHERE affected_by_rain = TRUE`,
						(err, rides) => {
							if (err) return res.json({ message: 'Park day updated', total_attendance })
							res.json({
								message: 'Park day updated',
								total_attendance,
								trigger_update: rain !== undefined ? {
									rain_status: rain,
									affected_rides: rides.map(r => ({ ride_name: r.ride_name, status_ride: r.status_ride }))
								} : null
							})
						}
					)
				}
			)
		})
	})
})

// GET /parkday — list park days with optional date range
// query params: ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/parkday', verifyToken, requireGM, (req, res) => {
	const { start, end } = req.query
	let sql = `SELECT day_id, park_date, rain, park_closed, weather_notes, total_attendance
	           FROM ParkDay`
	const params = []

	if (start && end) {
		sql += ' WHERE park_date BETWEEN ? AND ?'
		params.push(start, end)
	} else if (start) {
		sql += ' WHERE park_date >= ?'
		params.push(start)
	} else if (end) {
		sql += ' WHERE park_date <= ?'
		params.push(end)
	}

	sql += ' ORDER BY park_date DESC'

	db.query(sql, params, (err, results) => {
		if (err) return res.status(500).json({ message: 'Server error' })
		res.json(results)
	})
})

// GET /revenue — daily totals
router.get('/revenue', verifyToken, requireGM, (req, res) => {
	const { start, end } = req.query
	let sql = `SELECT DATE(transaction_time) AS revenue_date,
	                  SUM(total_amount) AS daily_total,
	                  COUNT(*) AS transaction_count
	           FROM Transactions`
	const params = []

  if (start && end) {
    sql += ' WHERE DATE(transaction_time) BETWEEN ? AND ?'
    params.push(start, end)
} else if (start) {
    sql += ' WHERE DATE(transaction_time) >= ?'
    params.push(start)
} else if (end) {
    sql += ' WHERE DATE(transaction_time) <= ?'
    params.push(end)
}

  sql += ' GROUP BY DATE(transaction_time) ORDER BY revenue_date DESC'

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

router.get('/revenue/breakdown', verifyToken, requireGM, (req, res) => {
  const { start, end } = req.query
  let sql = `
    SELECT 
      DATE(t.transaction_time) AS date_of_revenue,
      v.venue_name,
      v.venue_type,
      SUM(t.total_amount) AS revenue
    FROM Transactions t
    JOIN Venue v ON t.venue_id = v.venue_id
  `
  const params = []

  if (start && end) {
    sql += ' WHERE DATE(t.transaction_time) BETWEEN ? AND ?'
    params.push(start, end)
} else if (start) {
    sql += ' WHERE DATE(t.transaction_time) >= ?'
    params.push(start)
} else if (end) {
    sql += ' WHERE DATE(t.transaction_time) <= ?'
    params.push(end)
}

  sql += ' GROUP BY DATE(t.transaction_time), t.venue_id ORDER BY date_of_revenue DESC, v.venue_name'

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

router.get('/revenue/tickets', verifyToken, requireGM, (req, res) => {
  const { start, end } = req.query
  let sql = `
    SELECT 
      DATE(t.transaction_time) AS revenue_date,
      ti.item_type,
      SUM(t.total_amount) AS revenue,
      COUNT(*) AS transaction_count
    FROM Transactions t
    JOIN TransactionItem ti ON t.transaction_id = ti.transaction_id
    WHERE t.venue_id IS NULL
  `
  const params = []

  if (start && end) {
    sql += ' AND DATE(t.transaction_time) BETWEEN ? AND ?'
    params.push(start, end)
  } else if (start) {
    sql += ' AND DATE(t.transaction_time) >= ?'
    params.push(start)
  } else if (end) {
    sql += ' AND DATE(t.transaction_time) <= ?'
    params.push(end)
  }

  sql += ' GROUP BY DATE(t.transaction_time), ti.item_type ORDER BY revenue_date DESC, ti.item_type'

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

export default router
