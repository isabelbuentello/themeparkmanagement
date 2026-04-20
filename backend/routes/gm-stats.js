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

function isPastDate(dateText) {
	if (!dateText) return false

	const selectedDate = new Date(`${dateText}T00:00:00`)
	if (Number.isNaN(selectedDate.getTime())) return false

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	return selectedDate < today
}

// PARK DAY

// POST /parkday — log a new park day
// attendance is auto-counted from Visit table
router.post('/parkday', verifyToken, requireGM, (req, res) => {
	const { park_date, rain, park_closed, weather_notes } = req.body

	if (!park_date || rain === undefined || park_closed === undefined) {
		return res.status(400).json({ message: 'park_date, rain, and park_closed are required' })
	}

	if (isPastDate(park_date)) {
		return res.status(400).json({ message: 'park_date cannot be in the past' })
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
	const transactionFilters = []
	const maintenanceFilters = []
	const params = []

	if (start && end) {
		transactionFilters.push('DATE(transaction_time) BETWEEN ? AND ?')
		maintenanceFilters.push('DATE(COALESCE(cost_recorded_time, created_time)) BETWEEN ? AND ?')
		params.push(start, end, start, end)
	} else if (start) {
		transactionFilters.push('DATE(transaction_time) >= ?')
		maintenanceFilters.push('DATE(COALESCE(cost_recorded_time, created_time)) >= ?')
		params.push(start, start)
	} else if (end) {
		transactionFilters.push('DATE(transaction_time) <= ?')
		maintenanceFilters.push('DATE(COALESCE(cost_recorded_time, created_time)) <= ?')
		params.push(end, end)
	}

	const transactionWhere = transactionFilters.length ? `WHERE ${transactionFilters.join(' AND ')}` : ''
	const maintenanceWhere = maintenanceFilters.length ? `WHERE ${maintenanceFilters.join(' AND ')}` : ''

	const sql = `
	  SELECT
	    revenue_date,
	    SUM(gross_revenue) AS gross_revenue,
	    SUM(repair_cost) AS repair_cost,
	    SUM(gross_revenue) - SUM(repair_cost) AS daily_total,
	    SUM(transaction_count) AS transaction_count
	  FROM (
	    SELECT
	      DATE(transaction_time) AS revenue_date,
	      SUM(total_amount) AS gross_revenue,
	      0 AS repair_cost,
	      COUNT(*) AS transaction_count
	    FROM Transactions
	    ${transactionWhere}
	    GROUP BY DATE(transaction_time)

	    UNION ALL

	    SELECT
	      DATE(COALESCE(cost_recorded_time, created_time)) AS revenue_date,
	      0 AS gross_revenue,
	      SUM(COALESCE(cost_to_repair, 0)) AS repair_cost,
	      0 AS transaction_count
	    FROM MaintenanceRequest
	    WHERE cost_to_repair IS NOT NULL
	    ${maintenanceWhere ? `AND ${maintenanceWhere.replace(/^WHERE\s+/, '')}` : ''}
	    GROUP BY DATE(COALESCE(cost_recorded_time, created_time))
	  ) revenue_parts
	  GROUP BY revenue_date
	  ORDER BY revenue_date DESC
	`

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

router.get('/customer-loyalty', verifyToken, requireGM, async (req, res) => {
  const query = (sql, params = []) => db.promise().query(sql, params)
  const { status, tier } = req.query
  const validStatuses = ['active', 'expired', 'canceled']
  const validTiers = ['silver', 'gold', 'platinum']

  try {
    const filters = []
    const filterParams = []

    if (status && validStatuses.includes(status)) {
      filters.push('m.status_membership = ?')
      filterParams.push(status)
    }

    if (tier && validTiers.includes(tier)) {
      filters.push('mt.tier_name = ?')
      filterParams.push(tier)
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

    const latestMembershipSql = `
      FROM Membership m
      JOIN (
        SELECT account_id, MAX(membership_id) AS membership_id
        FROM Membership
        GROUP BY account_id
      ) latest ON latest.membership_id = m.membership_id
      JOIN MembershipTier mt ON mt.tier_id = m.tier_id
      JOIN Account a ON a.account_id = m.account_id
      JOIN Customer c ON c.customer_id = a.customer_id
      LEFT JOIN (
        SELECT
          account_id,
          SUM(total_amount) AS total_spent,
          COUNT(*) AS transaction_count
        FROM Transactions
        GROUP BY account_id
      ) spending ON spending.account_id = a.account_id
    `

    const durationSql = `
      CASE
        WHEN m.status_membership = 'active' THEN DATEDIFF(CURDATE(), m.start_date)
        ELSE DATEDIFF(m.end_date, m.start_date)
      END
    `

    const [
      [statusCounts],
      [tierCounts],
      [members],
      [summaryRows],
      [loyalRows],
      [globalSummaryRows],
      [globalLoyalRows],
      [mostActiveTierRows]
    ] = await Promise.all([
      query(`
        SELECT m.status_membership AS status, COUNT(*) AS member_count
        ${latestMembershipSql}
        ${whereSql}
        GROUP BY m.status_membership
        ORDER BY member_count DESC, status
      `, filterParams),
      query(`
        SELECT mt.tier_name AS tier, COUNT(*) AS member_count
        ${latestMembershipSql}
        ${whereSql}
        GROUP BY mt.tier_name
        ORDER BY member_count DESC, tier
      `, filterParams),
      query(`
        SELECT
          c.customer_id,
          CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
          c.customer_email,
          a.username,
          m.membership_id,
          mt.tier_name,
          m.status_membership,
          m.start_date,
          m.end_date,
          m.auto_renew,
          ${durationSql} AS days_as_member,
          COALESCE(spending.total_spent, 0) AS total_spent,
          COALESCE(spending.transaction_count, 0) AS transaction_count
        ${latestMembershipSql}
        ${whereSql}
        ORDER BY days_as_member DESC, m.start_date ASC, customer_name
      `, filterParams),
      query(`
        SELECT
          COUNT(*) AS total_members,
          SUM(CASE WHEN m.status_membership = 'active' THEN 1 ELSE 0 END) AS active_members
        ${latestMembershipSql}
        ${whereSql}
      `, filterParams),
      query(`
        SELECT
          c.customer_id,
          CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
          c.customer_email,
          MIN(all_m.start_date) AS member_since,
          DATEDIFF(CURDATE(), MIN(all_m.start_date)) AS days_as_member,
          COUNT(all_m.membership_id) AS membership_count,
          latest_m.status_membership,
          mt.tier_name
        FROM Membership all_m
        JOIN Account a ON a.account_id = all_m.account_id
        JOIN Customer c ON c.customer_id = a.customer_id
        JOIN (
          SELECT account_id, MAX(membership_id) AS membership_id
          FROM Membership
          GROUP BY account_id
        ) latest ON latest.account_id = all_m.account_id
        JOIN Membership latest_m ON latest_m.membership_id = latest.membership_id
        JOIN MembershipTier mt ON mt.tier_id = latest_m.tier_id
        ${whereSql.replaceAll('m.', 'latest_m.')}
        GROUP BY
          c.customer_id,
          c.first_name,
          c.last_name,
          c.customer_email,
          latest_m.status_membership,
          mt.tier_name
        ORDER BY days_as_member DESC, member_since ASC
        LIMIT 1
      `, filterParams),
      query(`
        SELECT
          COUNT(*) AS total_members,
          SUM(CASE WHEN m.status_membership = 'active' THEN 1 ELSE 0 END) AS active_members
        ${latestMembershipSql}
      `),
      query(`
        SELECT
          c.customer_id,
          CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
          c.customer_email,
          MIN(all_m.start_date) AS member_since,
          DATEDIFF(CURDATE(), MIN(all_m.start_date)) AS days_as_member,
          COUNT(all_m.membership_id) AS membership_count,
          latest_m.status_membership,
          mt.tier_name
        FROM Membership all_m
        JOIN Account a ON a.account_id = all_m.account_id
        JOIN Customer c ON c.customer_id = a.customer_id
        JOIN (
          SELECT account_id, MAX(membership_id) AS membership_id
          FROM Membership
          GROUP BY account_id
        ) latest ON latest.account_id = all_m.account_id
        JOIN Membership latest_m ON latest_m.membership_id = latest.membership_id
        JOIN MembershipTier mt ON mt.tier_id = latest_m.tier_id
        GROUP BY
          c.customer_id,
          c.first_name,
          c.last_name,
          c.customer_email,
          latest_m.status_membership,
          mt.tier_name
        ORDER BY days_as_member DESC, member_since ASC
        LIMIT 1
      `),
      query(`
        SELECT mt.tier_name AS tier, COUNT(*) AS active_count
        ${latestMembershipSql}
        WHERE m.status_membership = 'active'
        GROUP BY mt.tier_name
        ORDER BY active_count DESC, tier
        LIMIT 1
      `)
    ])

    const mostCommonStatus = statusCounts[0]?.status || null

    res.json({
      summary: {
        totalMembers: Number(summaryRows[0]?.total_members || 0),
        activeMembers: Number(summaryRows[0]?.active_members || 0),
        mostCommonStatus,
        mostLoyalCustomer: loyalRows[0] || null
      },
      globalSummary: {
        totalMembers: Number(globalSummaryRows[0]?.total_members || 0),
        activeMembers: Number(globalSummaryRows[0]?.active_members || 0),
        mostActiveMembership: mostActiveTierRows[0] || null,
        mostLoyalCustomer: globalLoyalRows[0] || null
      },
      statusCounts,
      tierCounts,
      members
    })
  } catch (err) {
    console.error('Customer loyalty report error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
