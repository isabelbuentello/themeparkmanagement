import jwt from 'jsonwebtoken'
import express from 'express'
import db from '../db.js'

const router = express.Router()

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

function isPastDate(dateText) {
  if (!dateText) return false
  const selectedDate = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(selectedDate.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate < today
}

// ─────────────────────────────────────────
// PRICES
// ─────────────────────────────────────────

const TICKET_PRICES = { 1: 25.00, 2: 10.00 }
const PASS_PRICES = { 1: 15.00, 2: 20.00, 3: 10.00, 4: 150.00 }

// ─────────────────────────────────────────
// CUSTOMER LOOKUP
// ─────────────────────────────────────────

router.get('/customer-lookup', verifyToken, (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).json({ message: 'Email is required' })

  db.query(
    `SELECT c.customer_id, a.account_id, c.first_name, c.last_name
     FROM Customer c
     LEFT JOIN Account a ON a.customer_id = c.customer_id
     WHERE c.customer_email = ?
     LIMIT 1`,
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      if (results.length === 0) return res.status(404).json({ message: 'Customer not found' })
      res.json(results[0])
    }
  )
})

// ─────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────

router.get('/ticket-types', (req, res) => {
  db.query('SELECT * FROM TicketType', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

router.post('/tickets', verifyToken, requireRole('ticket_seller', 'general_manager'), (req, res) => {
  const { ticket_type_id, customer_id, valid_date, payment_method_transaction, account_id } = req.body

  if (!valid_date) return res.status(400).json({ message: 'valid_date is required' })

  const selectedDate = new Date(valid_date)
  if (Number.isNaN(selectedDate.getTime())) return res.status(400).json({ message: 'valid_date is invalid' })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  selectedDate.setHours(0, 0, 0, 0)
  if (selectedDate < today) return res.status(400).json({ message: 'valid_date cannot be in the past' })

  db.query(
    'SELECT price FROM TicketType WHERE ticket_type_id = ? LIMIT 1',
    [ticket_type_id],
    (lookupErr, ticketTypeRows) => {
      if (lookupErr) return res.status(500).json({ message: 'Server error' })
      if (!ticketTypeRows.length) return res.status(400).json({ message: 'Invalid ticket type' })

      const unit_price = Number(ticketTypeRows[0].price)
      if (!Number.isFinite(unit_price) || unit_price <= 0) return res.status(400).json({ message: 'Ticket type price is invalid' })

      db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ message: 'Server error' })

        connection.beginTransaction((err) => {
          if (err) { connection.release(); return res.status(500).json({ message: 'Server error' }) }

          connection.query(
            `INSERT INTO Ticket (ticket_type_id, customer_id, valid_date, status_ticket)
             VALUES (?, ?, ?, 'valid')`,
            [ticket_type_id, customer_id || null, valid_date],
            (err, ticketResult) => {
              if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating ticket' }) })

              connection.query(
                `INSERT INTO Transactions (account_id, transaction_time, total_amount, payment_method_transaction)
                 VALUES (?, CURDATE(), ?, ?)`,
                [account_id || null, unit_price, payment_method_transaction],
                (err, transResult) => {
                  if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction' }) })

                  connection.query(
                    `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
                     VALUES (?, 'ticket', 1, ?)`,
                    [transResult.insertId, unit_price],
                    (err) => {
                      if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction item' }) })

                      connection.commit((err) => {
                        connection.release()
                        if (err) return res.status(500).json({ message: 'Server error' })
                        res.json({ message: 'Ticket sold successfully', ticket_id: ticketResult.insertId, total: unit_price })
                      })
                    }
                  )
                }
              )
            }
          )
        })
      })
    }
  )
})

// ─────────────────────────────────────────
// PASSES
// ─────────────────────────────────────────

router.get('/pass-types', (req, res) => {
  db.query('SELECT * FROM PassType', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

router.post('/passes', verifyToken, requireRole('ticket_seller', 'parking_lot_manager', 'general_manager'), (req, res) => {
  const { pass_type_id, customer_id, quantity_purchased, payment_method_transaction, account_id } = req.body

  const unit_price = PASS_PRICES[pass_type_id]
  if (!unit_price) return res.status(400).json({ message: 'Invalid pass type' })

  const total_amount = (unit_price * quantity_purchased).toFixed(2)

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Server error' })

    connection.beginTransaction((err) => {
      if (err) { connection.release(); return res.status(500).json({ message: 'Server error' }) }

      connection.query(
        `INSERT INTO Pass (pass_type_id, customer_id, purchase_date, quantity_purchased, quantity_remaining, status_pass)
         VALUES (?, ?, CURDATE(), ?, ?, 'active')`,
        [pass_type_id, customer_id || null, quantity_purchased, quantity_purchased],
        (err, passResult) => {
          if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating pass' }) })

          connection.query(
            `INSERT INTO Transactions (account_id, transaction_time, total_amount, payment_method_transaction)
             VALUES (?, CURDATE(), ?, ?)`,
            [account_id || null, total_amount, payment_method_transaction],
            (err, transResult) => {
              if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction' }) })

              connection.query(
                `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
                 VALUES (?, 'pass', ?, ?)`,
                [transResult.insertId, quantity_purchased, unit_price],
                (err) => {
                  if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction item' }) })

                  connection.commit((err) => {
                    connection.release()
                    if (err) return res.status(500).json({ message: 'Server error' })
                    res.json({ message: 'Pass sold successfully', pass_id: passResult.insertId, total: total_amount })
                  })
                }
              )
            }
          )
        }
      )
    })
  })
})

// ─────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────

router.get('/parking-lots', verifyToken, requireRole('parking_lot_manager', 'general_manager'), (req, res) => {
  db.query('SELECT * FROM ParkingLot', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })
    res.json(results)
  })
})

router.post('/parking/start', verifyToken, requireRole('parking_lot_manager', 'general_manager'), (req, res) => {
  const { lot_id, customer_id } = req.body

  db.query(
    `INSERT INTO ParkingSession (lot_id, customer_id, entry_time, amount_paid)
     VALUES (?, ?, NOW(), 0)`,
    [lot_id, customer_id],
    (err, result) => {
      if (err) { console.log(err); return res.status(500).json({ message: 'Error starting parking session' }) }
      res.json({ message: 'Parking session started', session_id: result.insertId })
    }
  )
})

router.put('/parking/end/:session_id', verifyToken, requireRole('parking_lot_manager', 'general_manager'), (req, res) => {
  const { session_id } = req.params
  const { payment_method_transaction, account_id } = req.body

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

      db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ message: 'Server error' })

        connection.beginTransaction((err) => {
          if (err) { connection.release(); return res.status(500).json({ message: 'Server error' }) }

          connection.query(
            `UPDATE ParkingSession SET exit_time = NOW(), amount_paid = ? WHERE session_id = ?`,
            [amount_paid, session_id],
            (err) => {
              if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error ending session' }) })

              connection.query(
                `INSERT INTO Transactions (account_id, transaction_time, total_amount, payment_method_transaction)
                 VALUES (?, CURDATE(), ?, ?)`,
                [account_id || null, amount_paid, payment_method_transaction],
                (err, transResult) => {
                  if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction' }) })

                  connection.query(
                    `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
                     VALUES (?, 'other', 1, ?)`,
                    [transResult.insertId, amount_paid],
                    (err) => {
                      if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction item' }) })

                      connection.commit((err) => {
                        connection.release()
                        if (err) return res.status(500).json({ message: 'Server error' })
                        res.json({ message: 'Parking session ended', amount_paid })
                      })
                    }
                  )
                }
              )
            }
          )
        })
      })
    }
  )
})

// ─────────────────────────────────────────
// SHOP SALES
// ─────────────────────────────────────────

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

router.post('/shops/sell', verifyToken, requireRole('shop_manager', 'general_manager'), (req, res) => {
  const { venue_id, quantity, unit_price, payment_method_transaction, account_id } = req.body
  const total_amount = (quantity * unit_price).toFixed(2)

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: 'Server error' })

    connection.beginTransaction((err) => {
      if (err) { connection.release(); return res.status(500).json({ message: 'Server error' }) }

      connection.query(
        `UPDATE Shop SET total_merch_sold = total_merch_sold + ? WHERE venue_id = ?`,
        [quantity, venue_id],
        (err) => {
          if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error updating shop inventory' }) })

          connection.query(
            `INSERT INTO Transactions (account_id, transaction_time, total_amount, payment_method_transaction, venue_id)
             VALUES (?, CURDATE(), ?, ?, ?)`,
            [account_id || null, total_amount, payment_method_transaction, venue_id],
            (err, transResult) => {
              if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction' }) })

              connection.query(
                `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
                 VALUES (?, 'merch', ?, ?)`,
                [transResult.insertId, quantity, unit_price],
                (err) => {
                  if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction item' }) })

                  connection.commit((err) => {
                    connection.release()
                    if (err) return res.status(500).json({ message: 'Server error' })
                    res.json({ message: 'Sale recorded successfully', total: total_amount })
                  })
                }
              )
            }
          )
        }
      )
    })
  })
})

// ─────────────────────────────────────────
// RESTAURANT FOOD SALES
// ─────────────────────────────────────────

// GET all restaurants by name
router.get('/restaurants', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  db.query(
    `SELECT v.venue_id, v.venue_name 
     FROM Venue v JOIN Restaurant r ON v.venue_id = r.venue_id`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

router.get('/restaurants/menu', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  db.query(
    `SELECT menu_item_id, item_name, price, restaurant_venue_id
     FROM MenuItem WHERE is_available = true`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

router.get('/restaurants/menu-all', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  db.query(
    `SELECT menu_item_id, item_name, price, is_available, restaurant_venue_id
     FROM MenuItem`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

router.post('/restaurants/menu/add', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  const { restaurant_venue_id, item_name, price, is_available } = req.body
  db.query(
    `INSERT INTO MenuItem (restaurant_venue_id, item_name, price, is_available)
     VALUES (?, ?, ?, ?)`,
    [restaurant_venue_id, item_name, price, is_available ? 1 : 0],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error adding menu item' })
      res.json({ message: 'Menu item added successfully', menu_item_id: result.insertId })
    }
  )
})

router.put('/restaurants/menu/toggle/:menu_item_id', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  const { menu_item_id } = req.params
  const { is_available } = req.body
  db.query(
    `UPDATE MenuItem SET is_available = ? WHERE menu_item_id = ?`,
    [is_available ? 1 : 0, menu_item_id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error updating menu item' })
      res.json({ message: 'Menu item updated successfully' })
    }
  )
})

router.post('/restaurants/sell', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  const { venue_id, menu_item_id, quantity, payment_method_transaction, account_id } = req.body

  db.query(
    `SELECT price FROM MenuItem WHERE menu_item_id = ? AND is_available = true`,
    [menu_item_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      if (results.length === 0) return res.status(404).json({ message: 'Menu item not found or unavailable' })

      const unit_price = results[0].price
      const total_amount = (quantity * unit_price).toFixed(2)

      db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ message: 'Server error' })

        connection.beginTransaction((err) => {
          if (err) { connection.release(); return res.status(500).json({ message: 'Server error' }) }

          connection.query(
            `INSERT INTO Transactions (account_id, transaction_time, total_amount, payment_method_transaction, venue_id)
             VALUES (?, CURDATE(), ?, ?, ?)`,
            [account_id || null, total_amount, payment_method_transaction, venue_id],
            (err, transResult) => {
              if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction' }) })

              connection.query(
                `INSERT INTO TransactionItem (transaction_id, item_type, quantity, unit_price)
                 VALUES (?, 'food', ?, ?)`,
                [transResult.insertId, quantity, unit_price],
                (err) => {
                  if (err) return connection.rollback(() => { connection.release(); res.status(500).json({ message: 'Error creating transaction item' }) })

                  connection.commit((err) => {
                    connection.release()
                    if (err) return res.status(500).json({ message: 'Server error' })
                    res.json({ message: 'Food sale recorded successfully', total_amount })
                  })
                }
              )
            }
          )
        })
      })
    }
  )
})

// ─────────────────────────────────────────
// RESTAURANT RESERVATIONS
// ─────────────────────────────────────────

router.get('/restaurants/reservations', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  db.query(
    `SELECT rr.*, c.first_name, c.last_name 
     FROM RestaurantReservation rr
     JOIN Customer c ON rr.customer_id = c.customer_id
     ORDER BY rr.reservation_date, rr.reservation_time`,
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' })
      res.json(results)
    }
  )
})

router.post('/restaurants/reservations', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  const { restaurant_venue_id, customer_id, reservation_date, reservation_time, party_size } = req.body

  if (!restaurant_venue_id || !customer_id || !reservation_date || !reservation_time || !party_size) {
    return res.status(400).json({ message: 'Please fill in all fields' })
  }

  if (isPastDate(reservation_date)) {
    return res.status(400).json({ message: 'Reservation date cannot be in the past' })
  }

  db.query(
    `INSERT INTO RestaurantReservation (restaurant_venue_id, customer_id, reservation_date, reservation_time, party_size, status_reservation)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [restaurant_venue_id, customer_id, reservation_date, reservation_time, party_size],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error creating reservation' })
      res.json({ message: 'Reservation created successfully', reservation_id: result.insertId })
    }
  )
})

router.put('/restaurants/reservations/:reservation_id', verifyToken, requireRole('restaurant_manager', 'general_manager'), (req, res) => {
  const { reservation_id } = req.params
  const { status_reservation } = req.body

  db.query(
    `UPDATE RestaurantReservation SET status_reservation = ? WHERE reservation_id = ?`,
    [status_reservation, reservation_id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Error updating reservation' })
      res.json({ message: 'Reservation updated successfully' })
    }
  )
})

export default router