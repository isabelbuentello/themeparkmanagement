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

// any employee can report an emergency
router.post('/emergency', verifyToken, (req, res) => {
  const { date_of_emergency, event_lat, event_long, event_description } = req.body

  if (!date_of_emergency || !event_lat || !event_long || !event_description) {
    return res.status(400).json({ message: 'All fields are required' })
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
    `INSERT INTO MaintenanceRequest (ride_id, submitted_by_employee_id, issue_description, priority)
     VALUES (?, ?, ?, ?)`,
    [ride_id, submitted_by_employee_id, issue_description, priority || 'medium'],
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
            mr.assigned_to_employee_id, mr.created_time
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



export default router