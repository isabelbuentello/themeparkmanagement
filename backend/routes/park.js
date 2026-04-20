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

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    next()
  }
}

function normalizeDateTimeInput(value) {
  if (!value) return null

  if (typeof value === 'string' && value.includes('T')) {
    return `${value.replace('T', ' ')}:00`
  }

  return value
}

function isPastDate(dateText) {
  if (!dateText) return false

  const selectedDate = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(selectedDate.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return selectedDate < today
}

function isPastDateTime(dateTimeText) {
  if (!dateTimeText) return false

  const selectedDate = new Date(dateTimeText.replace(' ', 'T'))
  if (Number.isNaN(selectedDate.getTime())) return false

  return selectedDate < new Date()
}

// any employee can report an emergency
router.post('/emergency', verifyToken, (req, res) => {
  const { date_of_emergency, event_lat, event_long, event_description } = req.body

  if (!date_of_emergency || !event_lat || !event_long || !event_description) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  if (isPastDate(date_of_emergency)) {
    return res.status(400).json({ message: 'Emergency date cannot be in the past' })
  }

  db.query(
    `INSERT INTO EmergencyEvent (date_of_emergency, event_lat, event_long, event_description)
     VALUES (?, ?, ?, ?)`,
    [date_of_emergency, event_lat, event_long, event_description],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error reporting emergency' })
      res.json({ message: 'Emergency reported successfully' })
    }
  )
})

// manager can view all emergency events
router.get('/emergency', verifyToken, (req, res) => {
  if (req.user.role !== 'general_manager') {
    return res.status(403).json({ message: 'Access denied' })
  }

  db.query(
    'SELECT * FROM EmergencyEvent ORDER BY date_of_emergency DESC',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

// any employee can submit a maintenance request
router.post('/maintenance-request', verifyToken, (req, res) => {
  const { ride_id, issue_description, priority } = req.body
  const submitted_by_employee_id = req.user.id

  if (!ride_id || !issue_description) {
    return res.status(400).json({ message: 'Ride ID and description are required' })
  }

  db.query(
    `INSERT INTO MaintenanceRequest
     (ride_id, submitted_by_employee_id, issue_description, priority)
     VALUES (?, ?, ?, ?)`,
    [
      ride_id,
      submitted_by_employee_id,
      issue_description,
      priority || 'medium'
    ],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error submitting request' })
      res.json({ message: 'Maintenance request submitted successfully' })
    }
  )
})

// manager and maintenance can view all maintenance requests
router.get('/maintenance-request', verifyToken, (req, res) => {
  if (req.user.role !== 'general_manager' && req.user.role !== 'maintenance') {
    return res.status(403).json({ message: 'Access denied' })
  }

  db.query(
    `SELECT mr.request_id, mr.ride_id, r.ride_name, mr.submitted_by_employee_id,
            mr.issue_description, mr.priority, mr.status_request,
            mr.assigned_to_employee_id, mr.cost_to_repair, mr.created_time
     FROM MaintenanceRequest mr
     JOIN Ride r ON mr.ride_id = r.ride_id
     ORDER BY mr.created_time DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

// any employee can view rides (for maintenance request dropdown)
router.get('/rides', verifyToken, (req, res) => {
  db.query(
    'SELECT ride_id, ride_name FROM Ride ORDER BY ride_name',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

router.get(
  '/shows',
  verifyToken,
  requireRole('shows_manager', 'general_manager'),
  (req, res) => {
    db.query(
      `
        SELECT
          ps.show_id,
          v.venue_id,
          v.venue_name,
          v.hours,
          v.venue_lat,
          v.venue_long,
          ps.show_category,
          ps.duration,
          st.show_time,
          st.show_start_time
        FROM ParkShow ps
        JOIN Venue v ON v.venue_id = ps.venue_id
        LEFT JOIN ShowTime st ON st.show_id = ps.show_id
        WHERE v.venue_type = 'show'
        ORDER BY v.venue_name, st.show_start_time
      `,
      (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' })

        const showsById = new Map()

        for (const row of results) {
          if (!showsById.has(row.show_id)) {
            showsById.set(row.show_id, {
              show_id: row.show_id,
              venue_id: row.venue_id,
              venue_name: row.venue_name,
              hours: row.hours,
              venue_lat: row.venue_lat,
              venue_long: row.venue_long,
              show_category: row.show_category,
              duration: row.duration,
              showtimes: []
            })
          }

          if (row.show_time) {
            showsById.get(row.show_id).showtimes.push({
              show_time: row.show_time,
              show_start_time: row.show_start_time
            })
          }
        }

        res.json(Array.from(showsById.values()))
      }
    )
  }
)

router.post(
  '/shows',
  verifyToken,
  requireRole('shows_manager', 'general_manager'),
  (req, res) => {
    const {
      venue_name,
      hours,
      venue_lat,
      venue_long,
      show_category,
      duration
    } = req.body

    if (
      !venue_name ||
      !hours ||
      venue_lat === undefined ||
      venue_long === undefined ||
      !show_category ||
      duration === undefined
    ) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    db.getConnection((connErr, connection) => {
      if (connErr) return res.status(500).json({ message: 'Server error' })

      connection.beginTransaction((txErr) => {
        if (txErr) {
          connection.release()
          return res.status(500).json({ message: 'Server error' })
        }

        connection.query(
        `
          INSERT INTO Venue (venue_type, venue_name, hours, venue_lat, venue_long)
          VALUES ('show', ?, ?, ?, ?)
        `,
        [venue_name, hours, venue_lat, venue_long],
        (venueErr, venueResult) => {
          if (venueErr) {
            return connection.rollback(() => {
              connection.release()
              res.status(500).json({ message: 'Error creating show venue' })
            })
          }

          connection.query(
            `
              INSERT INTO ParkShow (venue_id, show_lat, show_long, show_category, duration)
              VALUES (?, ?, ?, ?, ?)
            `,
            [
              venueResult.insertId,
              venue_lat,
              venue_long,
              show_category,
              duration
            ],
            (showErr, showResult) => {
              if (showErr) {
                return connection.rollback(() => {
                  connection.release()
                  res.status(500).json({ message: 'Error creating show' })
                })
              }

              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    connection.release()
                    res.status(500).json({ message: 'Server error' })
                  })
                }

                connection.release()

                res.status(201).json({
                  message: 'Show created successfully',
                  show_id: showResult.insertId,
                  venue_id: venueResult.insertId
                })
              })
            }
          )
        }
        )
      })
    })
  }
)

router.post(
  '/shows/:showId/times',
  verifyToken,
  requireRole('shows_manager', 'general_manager'),
  (req, res) => {
    const { showId } = req.params
    const normalizedStartTime = normalizeDateTimeInput(req.body.show_start_time)

    if (!normalizedStartTime) {
      return res.status(400).json({ message: 'Show start time is required' })
    }

    if (isPastDateTime(normalizedStartTime)) {
      return res.status(400).json({ message: 'Show start time cannot be in the past' })
    }

    db.query(
      'SELECT show_id FROM ParkShow WHERE show_id = ? LIMIT 1',
      [showId],
      (lookupErr, showRows) => {
        if (lookupErr) return res.status(500).json({ message: 'Server error' })
        if (!showRows.length) {
          return res.status(404).json({ message: 'Show not found' })
        }

        db.query(
          `
            INSERT INTO ShowTime (show_id, show_start_time)
            VALUES (?, ?)
          `,
          [showId, normalizedStartTime],
          (insertErr, insertResult) => {
            if (insertErr) {
              return res.status(500).json({ message: 'Error creating showtime' })
            }

            res.status(201).json({
              message: 'Showtime added successfully',
              show_time: insertResult.insertId
            })
          }
        )
      }
    )
  }
)



export default router
