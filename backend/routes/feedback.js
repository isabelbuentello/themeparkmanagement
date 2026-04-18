import express from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

function getTokenPayload(req) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

function requireCustomer(req, res, next) {
  const payload = getTokenPayload(req)

  if (!payload) {
    return res.status(401).json({ message: 'Login required' })
  }

  if (payload.role !== 'customer') {
    return res.status(403).json({ message: 'Customers only' })
  }

  req.user = payload
  next()
}

function attachOptionalUser(req, res, next) {
  req.user = getTokenPayload(req)
  next()
}

router.post('/reviews', requireCustomer, (req, res) => {
  const { rating, notes, venue_id = null, ride_id = null } = req.body

  if (!rating || !notes?.trim()) {
    return res.status(400).json({ message: 'Rating and review notes are required' })
  }

  const normalizedRating = Number(rating) * 2

  if (Number.isNaN(normalizedRating) || normalizedRating < 1 || normalizedRating > 10) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  }

  db.query(
    `
      SELECT customer_id
      FROM Account
      WHERE account_id = ?
      LIMIT 1
    `,
    [req.user.id],
    (lookupErr, lookupResults) => {
      if (lookupErr) {
        return res.status(500).json({ message: 'Server error' })
      }

      if (!lookupResults.length) {
        return res.status(404).json({ message: 'Customer account not found' })
      }

      const customerId = lookupResults[0].customer_id

      db.query(
        `
          INSERT INTO Review (
            customer_id,
            ride_id,
            venue_id,
            rating,
            comment,
            review_created_date
          )
          VALUES (?, ?, ?, ?, ?, CURDATE())
        `,
        [customerId, ride_id, venue_id, normalizedRating, notes.trim()],
        (insertErr, result) => {
          if (insertErr) {
            return res.status(500).json({ message: 'Unable to submit review' })
          }

          return res.status(201).json({
            message: 'Review submitted successfully',
            review_id: result.insertId
          })
        }
      )
    }
  )
})

router.post('/complaints', attachOptionalUser, (req, res) => {
  const { notes, venue_id = null, ride_id = null } = req.body

  if (!notes?.trim()) {
    return res.status(400).json({ message: 'Complaint details are required' })
  }

  const finishInsert = (customerId) => {
    db.query(
      `
        INSERT INTO Complaint (
          customer_id,
          venue_id,
          ride_id,
          complaint_description,
          created_date,
          resolved,
          resolved_date
        )
        VALUES (?, ?, ?, ?, CURDATE(), false, NULL)
      `,
      [customerId, venue_id, ride_id, notes.trim()],
      (insertErr, result) => {
        if (insertErr) {
          return res.status(500).json({ message: 'Unable to submit complaint' })
        }

        return res.status(201).json({
          message: 'Complaint submitted successfully',
          complaint_id: result.insertId
        })
      }
    )
  }

  if (!req.user || req.user.role !== 'customer') {
    return finishInsert(null)
  }

  db.query(
    `
      SELECT customer_id
      FROM Account
      WHERE account_id = ?
      LIMIT 1
    `,
    [req.user.id],
    (lookupErr, lookupResults) => {
      if (lookupErr) {
        return res.status(500).json({ message: 'Server error' })
      }

      const customerId = lookupResults.length ? lookupResults[0].customer_id : null
      return finishInsert(customerId)
    }
  )
})

// middleware for GM access
function requireGM(req, res, next) {
  const payload = getTokenPayload(req)
  if (!payload) return res.status(401).json({ message: 'Login required' })
  if (payload.role !== 'general_manager') {
    return res.status(403).json({ message: 'GM access required' })
  }
  req.user = payload
  next()
}

// GET all complaints (for GM)
router.get('/complaints', requireGM, (req, res) => {
  db.query('SELECT * FROM Complaint ORDER BY created_date DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

// GET all reviews (for GM)
router.get('/reviews', requireGM, (req, res) => {
  db.query('SELECT * FROM Review ORDER BY review_created_date DESC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

// PATCH resolve/unresolve a complaint
router.patch('/complaints/:complaint_id', requireGM, (req, res) => {
  const { complaint_id } = req.params
  const { resolved } = req.body

  db.query(
    `UPDATE Complaint 
     SET resolved = ?, resolved_date = ? 
     WHERE complaint_id = ?`,
    [resolved, resolved ? new Date() : null, complaint_id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error updating complaint' })
      res.json({ message: `Complaint marked as ${resolved ? 'resolved' : 'unresolved'}` })
    }
  )
})

export default router
