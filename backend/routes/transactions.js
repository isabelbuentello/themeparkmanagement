import express from 'express'
import db from '../db.js'

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token provided' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Access denied' })
    next()
  }
}

const router = express.Router()

// ─────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────

// GET all ticket types (so the seller knows what to sell)
router.get('/ticket-types', verifyToken, requireRole('ticket_seller', 'general_manager'), (req, res) => {
  db.query('SELECT * FROM TicketType', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

// POST sell a ticket to a customer
router.post('/tickets', verifyToken, requireRole('ticket_seller', 'general_manager'), (req, res) => {
  const { ticket_type_id, customer_id, valid_date, payment_method_transaction, account_id } = req.body

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Server error' })

    // insert the ticket
    db.query(
      `INSERT INTO Ticket (ticket_type_id, customer_id, valid_date, status_ticket)
       VALUES (?, ?, ?, 'valid')`,
      [ticket_type_id, customer_id, valid_date],
      (err, ticketResult) => {
        if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating ticket' }))

        // create the transaction record
        db.query(
          `INSERT INTO \`Transaction\` (account_id, transaction_time, total_amount, payment_method_transaction)
           VALUES (?, CURDATE(), (SELECT price FROM TicketType WHERE ticket_type_id = ?), ?)`,
          [account_id || null, ticket_type_id, payment_method_transaction],
          (err, transResult) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction' }))

            const transaction_id = transResult.insertId

            // create the transaction item
            db.query(
              `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
               VALUES (?, 'ticket', 1, (SELECT price FROM TicketType WHERE ticket_type_id = ?))`,
              [transaction_id, ticket_type_id],
              (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction item' }))

                db.commit((err) => {
                  if (err) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
                  res.json({ message: 'Ticket sold successfully', ticket_id: ticketResult.insertId })
                })
              }
            )
          }
        )
      }
    )
  })
})

// ─────────────────────────────────────────
// PASSES
// ─────────────────────────────────────────

// GET all pass types
router.get('/pass-types', verifyToken, requireRole('ticket_seller', 'parking_lot_manager', 'general_manager'), (req, res) => {
  db.query('SELECT * FROM PassType', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

// POST sell a pass to a customer
router.post('/passes', verifyToken, requireRole('ticket_seller', 'parking_lot_manager', 'general_manager'), (req, res) => {
  const { pass_type_id, customer_id, quantity_purchased, payment_method_transaction, account_id } = req.body

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Server error' })

    db.query(
      `INSERT INTO Pass (pass_type_id, customer_id, purchase_date, quantity_purchased, quantity_remaining, status_pass)
       VALUES (?, ?, CURDATE(), ?, ?, 'active')`,
      [pass_type_id, customer_id, quantity_purchased, quantity_purchased],
      (err, passResult) => {
        if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating pass' }))

        db.query(
          `INSERT INTO \`Transaction\` (account_id, transaction_time, total_amount, payment_method_transaction)
           VALUES (?, CURDATE(), 0, ?)`,
          [account_id || null, payment_method_transaction],
          (err, transResult) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction' }))

            const transaction_id = transResult.insertId

            db.query(
              `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
               VALUES (?, 'pass', ?, 0)`,
              [transaction_id, quantity_purchased],
              (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction item' }))

                db.commit((err) => {
                  if (err) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
                  res.json({ message: 'Pass sold successfully', pass_id: passResult.insertId })
                })
              }
            )
          }
        )
      }
    )
  })
})

// ─────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────

// GET all parking lots and their availability
router.get('/parking-lots', verifyToken, requireRole('parking_lot_manager', 'general_manager'), (req, res) => {
  db.query('SELECT * FROM ParkingLot', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

// POST start a parking session (customer enters lot)
router.post('/parking/start', verifyToken, requireRole('parking_lot_manager', 'general_manager'), (req, res) => {
  const { lot_id, customer_id } = req.body

  db.query(
    `INSERT INTO ParkingSession (lot_id, customer_id, entry_time, amount_paid)
     VALUES (?, ?, NOW(), 0)`,
    [lot_id, customer_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error starting parking session' })
      res.json({ message: 'Parking session started', session_id: result.insertId })
    }
  )
})

// PUT end a parking session and calculate amount owed
router.put('/parking/end/:session_id', verifyToken, requireRole('parking_lot_manager', 'general_manager'), (req, res) => {
  const { session_id } = req.params
  const { payment_method_transaction, account_id } = req.body

  // get the session and lot rate
  db.query(
    `SELECT ps.*, pl.hourly_rate 
     FROM ParkingSession ps 
     JOIN ParkingLot pl ON ps.lot_id = pl.lot_id 
     WHERE ps.session_id = ?`,
    [session_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      if (results.length === 0) return res.status(404).json({ message: 'Session not found' })

      const session = results[0]
      const hoursParked = (Date.now() - new Date(session.entry_time)) / (1000 * 60 * 60)
      const amount_paid = Math.min((hoursParked * session.hourly_rate).toFixed(2), 500)

      db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Server error' })

        // close out the session
        db.query(
          `UPDATE ParkingSession SET exit_time = NOW(), amount_paid = ? WHERE session_id = ?`,
          [amount_paid, session_id],
          (err) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Error ending session' }))

            // record the transaction
            db.query(
              `INSERT INTO \`Transaction\` (account_id, transaction_time, total_amount, payment_method_transaction)
               VALUES (?, CURDATE(), ?, ?)`,
              [account_id || null, amount_paid, payment_method_transaction],
              (err, transResult) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction' }))

                db.query(
                  `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
                   VALUES (?, 'other', 1, ?)`,
                  [transResult.insertId, amount_paid],
                  (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction item' }))

                    db.commit((err) => {
                      if (err) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
                      res.json({ message: 'Parking session ended', amount_paid })
                    })
                  }
                )
              }
            )
          }
        )
      })
    }
  )
})

// ─────────────────────────────────────────
// SHOP SALES
// ─────────────────────────────────────────

// GET shop info
router.get('/shops', verifyToken, requireRole('shop_manager', 'general_manager'), (req, res) => {
  db.query(
    `SELECT v.venue_id, v.venue_name, s.space_for_items_sqft, s.total_merch_sold
     FROM Venue v JOIN Shop s ON v.venue_id = s.venue_id`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

// POST sell merchandise
router.post('/shops/sell', verifyToken, requireRole('shop_manager', 'general_manager'), (req, res) => {
  const { venue_id, quantity, unit_price, payment_method_transaction, account_id } = req.body
  const total_amount = (quantity * unit_price).toFixed(2)

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: 'Server error' })

    // update total_merch_sold
    db.query(
      `UPDATE Shop SET total_merch_sold = total_merch_sold + ? WHERE venue_id = ?`,
      [quantity, venue_id],
      (err) => {
        if (err) return db.rollback(() => res.status(500).json({ message: 'Error updating shop inventory' }))

        db.query(
          `INSERT INTO \`Transaction\` (account_id, transaction_time, total_amount, payment_method_transaction, venue_id)
           VALUES (?, CURDATE(), ?, ?, ?)`,
          [account_id || null, total_amount, payment_method_transaction, venue_id],
          (err, transResult) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction' }))

            db.query(
              `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
               VALUES (?, 'merch', ?, ?)`,
              [transResult.insertId, quantity, unit_price],
              (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction item' }))

                db.commit((err) => {
                  if (err) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
                  res.json({ message: 'Sale recorded successfully' })
                })
              }
            )
          }
        )
      }
    )
  })
})

// ─────────────────────────────────────────
// RESTAURANT FOOD SALES
// ─────────────────────────────────────────

// POST sell food (restaurant manager rings up an order)
router.post('/restaurants/sell', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  const { venue_id, menu_item_id, quantity, payment_method_transaction, account_id } = req.body

  // get the price from the menu item
  db.query(
    `SELECT price FROM MenuItem WHERE menu_item_id = ? AND is_available = true`,
    [menu_item_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      if (results.length === 0) return res.status(404).json({ message: 'Menu item not found or unavailable' })

      const unit_price = results[0].price
      const total_amount = (quantity * unit_price).toFixed(2)

      db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: 'Server error' })

        db.query(
          `INSERT INTO \`Transaction\` (account_id, transaction_time, total_amount, payment_method_transaction, venue_id)
           VALUES (?, CURDATE(), ?, ?, ?)`,
          [account_id || null, total_amount, payment_method_transaction, venue_id],
          (err, transResult) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction' }))

            db.query(
              `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
               VALUES (?, 'food', ?, ?)`,
              [transResult.insertId, quantity, unit_price],
              (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error creating transaction item' }))

                db.commit((err) => {
                  if (err) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
                  res.json({ message: 'Food sale recorded successfully', total_amount })
                })
              }
            )
          }
        )
      })
    }
  )
})

export default router