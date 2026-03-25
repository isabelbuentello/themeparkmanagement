import express from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

const CUSTOMER_TICKET_PRODUCTS = [
  {
    id: 'single-day',
    name: 'Single-Day Admission',
    type: 'Day Ticket',
    tag: 'Best for first-time guests',
    description:
      'Full-day park entry with access to standard attractions and entertainment.',
    highlights: ['Park admission', 'Digital delivery', 'Flexible weekday use'],
    tickets: [{ ticket_type_id: 1, quantity: 1 }],
    passes: []
  },
  {
    id: 'weekend-flex',
    name: 'Weekend Flex Pass',
    type: 'Multi-Use Pass',
    tag: 'Most popular',
    description:
      'Two visits over any weekend in the current season with bonus snack credit.',
    highlights: ['Two admissions', '$15 snack credit', 'Skip cashier pickup'],
    tickets: [{ ticket_type_id: 1, quantity: 2 }],
    passes: []
  },
  {
    id: 'thrill-seeker-bundle',
    name: 'Thrill Seeker Bundle',
    type: 'Bundle',
    tag: 'Great for groups',
    description:
      'Admission plus express access windows and a photo package for your visit.',
    highlights: ['One admission', '1 fast pass', 'Photo package included'],
    tickets: [{ ticket_type_id: 1, quantity: 1 }],
    passes: [{ pass_type_id: 1, quantity: 1 }]
  },
  {
    id: 'family-four-pack',
    name: 'Family Four Pack',
    type: 'Family Bundle',
    tag: 'Built for planning ahead',
    description:
      'Four admissions in one checkout with shared digital tickets and parking.',
    highlights: ['4 admissions', 'Parking included', '1 shared digital wallet pass'],
    tickets: [{ ticket_type_id: 1, quantity: 4 }],
    passes: [{ pass_type_id: 3, quantity: 1 }]
  }
]

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

function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}

function commit() {
  return new Promise((resolve, reject) => {
    db.commit((err) => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}

function rollback() {
  return new Promise((resolve) => {
    db.rollback(() => resolve())
  })
}

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
    return res.status(401).json({ message: 'Login required to complete checkout' })
  }

  if (payload.role !== 'customer') {
    return res.status(403).json({ message: 'Customers only' })
  }

  req.user = payload
  next()
}

function formatReturnWindow(reservationTime) {
  const start = new Date(reservationTime)
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })

  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function formatQueueEntry(row) {
  return {
    reservationId: row.reservation_id,
    attractionId: String(row.ride_id),
    attractionName: row.ride_name,
    location: `Ride ${row.ride_id}`,
    returnWindow: formatReturnWindow(row.reservation_time),
    joinedAt: new Date(row.reservation_time).toISOString()
  }
}

async function getTicketTypePrices() {
  const rows = await query(
    `
      SELECT ticket_type_id, price
      FROM TicketType
    `
  )

  return new Map(
    rows.map((row) => [Number(row.ticket_type_id), Number(row.price)])
  )
}

async function getCustomerTicketProducts() {
  const ticketTypePrices = await getTicketTypePrices()

  return CUSTOMER_TICKET_PRODUCTS.map((product) => {
    const ticketPrice = product.tickets.reduce((sum, ticketConfig) => {
      const unitPrice = ticketTypePrices.get(Number(ticketConfig.ticket_type_id))

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new Error(`Missing price for ticket type ${ticketConfig.ticket_type_id}`)
      }

      return sum + unitPrice * ticketConfig.quantity
    }, 0)

    return {
      ...product,
      price: ticketPrice
    }
  })
}

router.get('/tickets', async (req, res) => {
  try {
    const products = await getCustomerTicketProducts()
    return res.json(products)
  } catch {
    return res.status(500).json({ message: 'Unable to load ticket products' })
  }
})

router.get('/queue', (req, res) => {
  db.query(
    `
      SELECT
        r.ride_id,
        r.ride_name,
        r.ride_type,
        r.status_ride,
        COUNT(CASE WHEN qr.reservation_fulfilled = 0 THEN 1 END) AS pending_reservations
      FROM VirtualQueue vq
      JOIN Ride r ON r.ride_id = vq.ride_id
      LEFT JOIN QueueReservation qr ON qr.queue_id = vq.queue_id
      GROUP BY r.ride_id, r.ride_name, r.ride_type, r.status_ride
      ORDER BY r.ride_name
    `,
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' })
      }

      const attractions = results.map((row) => {
        const pendingReservations = Number(row.pending_reservations || 0)
        const isAvailable = row.status_ride === 'open'

        return {
          id: String(row.ride_id),
          name: row.ride_name,
          location: `Ride ${row.ride_id}`,
          thrillLevel: row.ride_type,
          status: isAvailable ? 'Open' : 'Unavailable',
          waitTime: isAvailable ? `${15 + pendingReservations * 5} min` : 'Temporarily unavailable',
          returnWindow: isAvailable ? 'Assigned at booking' : 'Not available',
          description: `Current ride status: ${row.status_ride.replace('_', ' ')}`,
          pendingReservations
        }
      })

      return res.json(attractions)
    }
  )
})

router.get('/queue/active', requireCustomer, async (req, res) => {
  try {
    const customerRows = await query(
      `
        SELECT customer_id
        FROM Account
        WHERE account_id = ?
        LIMIT 1
      `,
      [req.user.id]
    )

    if (!customerRows.length) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    const [{ customer_id }] = customerRows
    const reservationRows = await query(
      `
        SELECT
          qr.reservation_id,
          qr.reservation_time,
          r.ride_id,
          r.ride_name
        FROM QueueReservation qr
        JOIN VirtualQueue vq ON vq.queue_id = qr.queue_id
        JOIN Ride r ON r.ride_id = vq.ride_id
        WHERE qr.customer_id = ?
          AND qr.reservation_fulfilled = 0
        ORDER BY qr.reservation_time DESC
        LIMIT 1
      `,
      [customer_id]
    )

    return res.json(
      reservationRows.length ? formatQueueEntry(reservationRows[0]) : null
    )
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/queue', requireCustomer, async (req, res) => {
  const { rideId } = req.body

  if (!rideId) {
    return res.status(400).json({ message: 'Ride ID is required' })
  }

  try {
    const customerRows = await query(
      `
        SELECT customer_id
        FROM Account
        WHERE account_id = ?
        LIMIT 1
      `,
      [req.user.id]
    )

    if (!customerRows.length) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    const [{ customer_id }] = customerRows
    const existingRows = await query(
      `
        SELECT reservation_id
        FROM QueueReservation
        WHERE customer_id = ?
          AND reservation_fulfilled = 0
        LIMIT 1
      `,
      [customer_id]
    )

    if (existingRows.length) {
      return res.status(400).json({ message: 'Only one active queue reservation is allowed' })
    }

    const queueRows = await query(
      `
        SELECT vq.queue_id, r.ride_id, r.ride_name, r.status_ride
        FROM VirtualQueue vq
        JOIN Ride r ON r.ride_id = vq.ride_id
        WHERE vq.ride_id = ?
        LIMIT 1
      `,
      [rideId]
    )

    if (!queueRows.length) {
      return res.status(404).json({ message: 'Queue-enabled ride not found' })
    }

    const queueRow = queueRows[0]

    if (queueRow.status_ride !== 'open') {
      return res.status(400).json({ message: 'This attraction is not available for virtual queue right now' })
    }

    const insertResult = await query(
      `
        INSERT INTO QueueReservation (
          queue_id,
          customer_id,
          reservation_time,
          reservation_fulfilled
        )
        VALUES (?, ?, NOW(), false)
      `,
      [queueRow.queue_id, customer_id]
    )

    const reservationRows = await query(
      `
        SELECT
          qr.reservation_id,
          qr.reservation_time,
          r.ride_id,
          r.ride_name
        FROM QueueReservation qr
        JOIN VirtualQueue vq ON vq.queue_id = qr.queue_id
        JOIN Ride r ON r.ride_id = vq.ride_id
        WHERE qr.reservation_id = ?
        LIMIT 1
      `,
      [insertResult.insertId]
    )

    return res.status(201).json(formatQueueEntry(reservationRows[0]))
  } catch {
    return res.status(500).json({ message: 'Unable to create queue reservation' })
  }
})

router.delete('/queue/:reservationId', requireCustomer, async (req, res) => {
  try {
    const customerRows = await query(
      `
        SELECT customer_id
        FROM Account
        WHERE account_id = ?
        LIMIT 1
      `,
      [req.user.id]
    )

    if (!customerRows.length) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    const [{ customer_id }] = customerRows
    const result = await query(
      `
        DELETE FROM QueueReservation
        WHERE reservation_id = ?
          AND customer_id = ?
          AND reservation_fulfilled = 0
      `,
      [req.params.reservationId, customer_id]
    )

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Active reservation not found' })
    }

    return res.json({ ok: true })
  } catch {
    return res.status(500).json({ message: 'Unable to cancel queue reservation' })
  }
})

router.post('/checkout', requireCustomer, async (req, res) => {
  const { cartItems, visitDate, paymentMethod = 'card' } = req.body

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart items are required' })
  }

  if (cartItems.some((item) => (item.kind ?? 'ticket') === 'ticket') && !visitDate) {
    return res.status(400).json({ message: 'Visit date is required' })
  }

  if (!['card', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' })
  }

  try {
    const availableProducts = await getCustomerTicketProducts()
    const membershipRows = await query(
      `
        SELECT tier_id, tier_name, discount, price
        FROM MembershipTier
      `
    )
    const membershipById = new Map(
      membershipRows.map((row) => [String(row.tier_id), {
        id: String(row.tier_id),
        tier_id: Number(row.tier_id),
        tier_name: row.tier_name,
        discount: Number(row.discount),
        price: Number(row.price)
      }])
    )
    const normalizedItems = []

    for (const item of cartItems) {
      const itemKind = item.kind ?? 'ticket'
      const quantity = Number(item.quantity)

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid cart item submitted' })
      }

      if (itemKind === 'membership') {
        const membership = membershipById.get(String(item.productId))

        if (!membership) {
          return res.status(400).json({ message: 'Invalid membership submitted' })
        }

        normalizedItems.push({
          kind: 'membership',
          product: membership,
          quantity: 1
        })
        continue
      }

      const product = availableProducts.find(
        (productOption) => productOption.id === item.productId
      )

      if (!product) {
        return res.status(400).json({ message: 'Invalid cart item submitted' })
      }

      normalizedItems.push({ kind: 'ticket', product, quantity })
    }

    const accountRows = await query(
      `
        SELECT account_id, customer_id
        FROM Account
        WHERE account_id = ?
        LIMIT 1
      `,
      [req.user.id]
    )

    if (!accountRows.length) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    const { account_id, customer_id } = accountRows[0]
    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    await beginTransaction()

    try {
      const transactionResult = await query(
        `
          INSERT INTO \`Transaction\` (
            account_id,
            transaction_time,
            total_amount,
            payment_method_transaction
          )
          VALUES (?, CURDATE(), ?, ?)
        `,
        [account_id, totalAmount, paymentMethod]
      )

      const ticketIds = []
      const passIds = []
      const membershipIds = []

      for (const item of normalizedItems) {
        if (item.kind === 'membership') {
          const membershipResult = await query(
            `
              INSERT INTO Membership (
                account_id,
                tier_id,
                start_date,
                end_date,
                status_membership,
                auto_renew,
                payment_method_membership
              )
              VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active', false, ?)
            `,
            [account_id, item.product.tier_id, paymentMethod]
          )

          membershipIds.push(membershipResult.insertId)

          await query(
            `
              INSERT INTO TransactionItem (
                transaction_id,
                item_type,
                quantity,
                unit_price
              )
              VALUES (?, 'other', ?, ?)
            `,
            [transactionResult.insertId, 1, item.product.price]
          )

          continue
        }

        for (let lineIndex = 0; lineIndex < item.quantity; lineIndex += 1) {
          for (const ticketConfig of item.product.tickets) {
            for (let ticketCount = 0; ticketCount < ticketConfig.quantity; ticketCount += 1) {
              const ticketResult = await query(
                `
                  INSERT INTO Ticket (
                    ticket_type_id,
                    customer_id,
                    valid_date,
                    status_ticket
                  )
                  VALUES (?, ?, ?, 'valid')
                `,
                [ticketConfig.ticket_type_id, customer_id, visitDate]
              )

              ticketIds.push(ticketResult.insertId)
            }
          }

          for (const passConfig of item.product.passes) {
            const passResult = await query(
              `
                INSERT INTO Pass (
                  pass_type_id,
                  customer_id,
                  purchase_date,
                  quantity_purchased,
                  quantity_remaining,
                  status_pass
                )
                VALUES (?, ?, CURDATE(), ?, ?, 'active')
              `,
              [
                passConfig.pass_type_id,
                customer_id,
                passConfig.quantity,
                passConfig.quantity
              ]
            )

            passIds.push(passResult.insertId)
          }
        }

        await query(
          `
            INSERT INTO TransactionItem (
              transaction_id,
              item_type,
              quantity,
              unit_price
            )
            VALUES (?, 'ticket', ?, ?)
          `,
          [transactionResult.insertId, item.quantity, item.product.price]
        )
      }

      await commit()

      return res.status(201).json({
        ok: true,
        confirmationId: `TPR-${transactionResult.insertId}`,
        transactionId: transactionResult.insertId,
        ticketIds,
        passIds,
        membershipIds,
        total: totalAmount
      })
    } catch {
      await rollback()
      return res.status(500).json({ message: 'Unable to complete checkout' })
    }
  } catch {
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
