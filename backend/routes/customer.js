import bcrypt from 'bcrypt'
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

function query(sql, params = [], executor = db) {
  return new Promise((resolve, reject) => {
    executor.query(sql, params, (err, results) => {
      if (err) {
        reject(err)
        return
      }

      resolve(results)
    })
  })
}

function getConnection() {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        reject(err)
        return
      }

      resolve(connection)
    })
  })
}

function beginTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((err) => {
      if (err) {
        connection.release()
        reject(err)
        return
      }

      resolve()
    })
  })
}

function commit(connection) {
  return new Promise((resolve, reject) => {
    connection.commit((err) => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}

function rollback(connection) {
  return new Promise((resolve) => {
    connection.rollback(() => resolve())
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

async function getCustomerAccountContext(accountId) {
  const rows = await query(
    `
      SELECT
        a.account_id,
        a.username,
        a.password,
        c.customer_id,
        c.first_name,
        c.last_name,
        c.customer_birthdate,
        c.customer_email,
        c.customer_phone,
        c.customer_address
      FROM Account a
      JOIN Customer c ON c.customer_id = a.customer_id
      WHERE a.account_id = ?
      LIMIT 1
    `,
    [accountId]
  )

  return rows[0] ?? null
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

router.get('/profile', requireCustomer, async (req, res) => {
  try {
    const customer = await getCustomerAccountContext(req.user.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    return res.json({
      name: `${customer.first_name} ${customer.last_name}`.trim(),
      email: customer.customer_email ?? '',
      username: customer.username ?? '',
      firstName: customer.first_name ?? '',
      lastName: customer.last_name ?? '',
      birthdate: customer.customer_birthdate ?? '',
      phone: customer.customer_phone ?? '',
      address: customer.customer_address ?? ''
    })
  } catch {
    return res.status(500).json({ message: 'Unable to load customer profile' })
  }
})

router.put('/profile', requireCustomer, async (req, res) => {
  const {
    firstName = '',
    lastName = '',
    birthdate = '',
    email = '',
    phone = '',
    address = ''
  } = req.body

  if (!firstName.trim() || !lastName.trim() || !birthdate || !email.trim() || !phone.trim()) {
    return res.status(400).json({ message: 'First name, last name, birth date, email, and phone are required' })
  }

  try {
    const customer = await getCustomerAccountContext(req.user.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    await query(
      `
        UPDATE Customer
        SET
          first_name = ?,
          last_name = ?,
          customer_birthdate = ?,
          customer_email = ?,
          customer_phone = ?,
          customer_address = ?
        WHERE customer_id = ?
      `,
      [
        firstName.trim(),
        lastName.trim(),
        birthdate,
        email.trim(),
        phone.trim(),
        address.trim() || null,
        customer.customer_id
      ]
    )

    return res.json({
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthdate,
      phone: phone.trim(),
      address: address.trim()
    })
  } catch {
    return res.status(500).json({ message: 'Unable to update customer profile' })
  }
})

router.get('/security', requireCustomer, async (req, res) => {
  try {
    const customer = await getCustomerAccountContext(req.user.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    return res.json({
      username: customer.username ?? ''
    })
  } catch {
    return res.status(500).json({ message: 'Unable to load security settings' })
  }
})

router.put('/security', requireCustomer, async (req, res) => {
  const {
    username = '',
    currentPassword = '',
    newPassword = '',
    confirmPassword = ''
  } = req.body

  if (!username.trim() || !currentPassword) {
    return res.status(400).json({ message: 'Username and current password are required' })
  }

  if (newPassword || confirmPassword) {
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password must match' })
    }
  }

  try {
    const customer = await getCustomerAccountContext(req.user.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      customer.password
    )

    if (!currentPasswordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    if (username.trim() !== customer.username) {
      const existingUsernameRows = await query(
        `
          SELECT account_id
          FROM Account
          WHERE username = ?
            AND account_id <> ?
          LIMIT 1
        `,
        [username.trim(), customer.account_id]
      )

      if (existingUsernameRows.length) {
        return res.status(400).json({ message: 'Username already taken' })
      }
    }

    const nextPassword = newPassword
      ? await bcrypt.hash(newPassword, 10)
      : customer.password

    await query(
      `
        UPDATE Account
        SET username = ?, password = ?
        WHERE account_id = ?
      `,
      [username.trim(), nextPassword, customer.account_id]
    )

    return res.json({
      username: username.trim(),
      message: newPassword
        ? 'Security settings updated.'
        : 'Username updated.'
    })
  } catch {
    return res.status(500).json({ message: 'Unable to update security settings' })
  }
})

router.get('/history', requireCustomer, async (req, res) => {
  try {
    const customer = await getCustomerAccountContext(req.user.id)

    if (!customer) {
      return res.status(404).json({ message: 'Customer account not found' })
    }

    const [transactionsResult, membershipsResult, reviewsResult, complaintsResult] = await Promise.allSettled([
      query(
        `
          SELECT
            t.transaction_id,
            t.transaction_time,
            t.total_amount,
            t.payment_method_transaction,
            ti.item_type,
            ti.quantity,
            ti.unit_price
          FROM \`Transaction\` t
          LEFT JOIN TransactionItem ti ON ti.transaction_id = t.transaction_id
          WHERE t.account_id = ?
          ORDER BY t.transaction_time DESC, t.transaction_id DESC
        `,
        [customer.account_id]
      ),
      query(
        `
          SELECT
            m.membership_id,
            mt.tier_name,
            m.start_date,
            m.end_date,
            m.status_membership
          FROM Membership m
          JOIN MembershipTier mt ON mt.tier_id = m.tier_id
          WHERE m.account_id = ?
          ORDER BY m.start_date DESC, m.membership_id DESC
        `,
        [customer.account_id]
      ),
      query(
        `
          SELECT review_id, rating, comment, review_created_date
          FROM Review
          WHERE customer_id = ?
          ORDER BY review_created_date DESC, review_id DESC
        `,
        [customer.customer_id]
      ),
      query(
        `
          SELECT complaint_id, complaint_description, created_date, resolved
          FROM Complaint
          WHERE customer_id = ?
          ORDER BY created_date DESC, complaint_id DESC
        `,
        [customer.customer_id]
      )
    ])

    const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value : []
    const memberships = membershipsResult.status === 'fulfilled' ? membershipsResult.value : []
    const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : []
    const complaints = complaintsResult.status === 'fulfilled' ? complaintsResult.value : []

    const groupedTransactions = []
    const transactionsById = new Map()

    transactions.forEach((row) => {
      if (!transactionsById.has(row.transaction_id)) {
        const entry = {
          transactionId: row.transaction_id,
          date: row.transaction_time,
          total: Number(row.total_amount),
          paymentMethod: row.payment_method_transaction,
          items: []
        }
        transactionsById.set(row.transaction_id, entry)
        groupedTransactions.push(entry)
      }

      if (row.item_type) {
        transactionsById.get(row.transaction_id).items.push({
          type: row.item_type,
          quantity: row.quantity,
          unitPrice: Number(row.unit_price)
        })
      }
    })

    return res.json({
      transactions: groupedTransactions,
      memberships: memberships.map((row) => ({
        membershipId: row.membership_id,
        tierName: row.tier_name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status_membership
      })),
      reviews: reviews.map((row) => ({
        reviewId: row.review_id,
        rating: row.rating,
        comment: row.comment,
        createdDate: row.review_created_date
      })),
      complaints: complaints.map((row) => ({
        complaintId: row.complaint_id,
        description: row.complaint_description,
        createdDate: row.created_date,
        resolved: Boolean(row.resolved)
      })),
      partial: [
        transactionsResult.status !== 'fulfilled' ? 'transactions' : null,
        membershipsResult.status !== 'fulfilled' ? 'memberships' : null,
        reviewsResult.status !== 'fulfilled' ? 'reviews' : null,
        complaintsResult.status !== 'fulfilled' ? 'complaints' : null
      ].filter(Boolean)
    })
  } catch {
    return res.status(500).json({ message: 'Unable to load customer history' })
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
  const {
    cartItems,
    visitDate,
    paymentMethod = 'card',
    cardholderName = '',
    cardNumber = '',
    cardExpiry = '',
    cardCvv = ''
  } = req.body

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart items are required' })
  }

  if (cartItems.some((item) => (item.kind ?? 'ticket') === 'ticket') && !visitDate) {
    return res.status(400).json({ message: 'Visit date is required' })
  }

  if (!['card', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' })
  }

  if (paymentMethod === 'card') {
    const normalizedCardNumber = String(cardNumber).replace(/\s+/g, '')
    const trimmedCardholderName = String(cardholderName).trim()
    const trimmedCardExpiry = String(cardExpiry).trim()
    const trimmedCardCvv = String(cardCvv).trim()
    const [expiryMonthText, expiryYearText] = trimmedCardExpiry.split('/')
    const expiryMonth = Number(expiryMonthText)
    const expiryYear = 2000 + Number(expiryYearText)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    if (!trimmedCardholderName) {
      return res.status(400).json({ message: 'Cardholder name is required for card payments' })
    }

    if (!/^\d{13,19}$/.test(normalizedCardNumber)) {
      return res.status(400).json({ message: 'Card number is invalid' })
    }

    if (!/^\d{2}\/\d{2}$/.test(trimmedCardExpiry)) {
      return res.status(400).json({ message: 'Card expiry must use MM/YY format' })
    }

    if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
      return res.status(400).json({ message: 'Card expiry month is invalid' })
    }

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return res.status(400).json({ message: 'Card expiry must be this month or later' })
    }

    if (!/^\d{3,4}$/.test(trimmedCardCvv)) {
      return res.status(400).json({ message: 'Card CVV is invalid' })
    }
  }

  try {
    const availableProducts = await getCustomerTicketProducts()
    const passTypeRows = await query(
      `
        SELECT pass_type_id
        FROM PassType
      `
    )
    const availablePassTypeIds = new Set(passTypeRows.map((row) => Number(row.pass_type_id)))
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

      const missingPassType = product.passes.find(
        (passConfig) => !availablePassTypeIds.has(Number(passConfig.pass_type_id))
      )

      if (missingPassType) {
        return res.status(400).json({
          message: `Checkout cannot complete because pass type ${missingPassType.pass_type_id} is not configured`
        })
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

    const connection = await getConnection()
    await beginTransaction(connection)

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
        [account_id, totalAmount, paymentMethod],
        connection
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
            [account_id, item.product.tier_id, paymentMethod],
            connection
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
            [transactionResult.insertId, 1, item.product.price],
            connection
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
                [ticketConfig.ticket_type_id, customer_id, visitDate],
                connection
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
              ],
              connection
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
          [transactionResult.insertId, item.quantity, item.product.price],
          connection
        )
      }

      await commit(connection)
      connection.release()

      return res.status(201).json({
        ok: true,
        confirmationId: `TPR-${transactionResult.insertId}`,
        transactionId: transactionResult.insertId,
        ticketIds,
        passIds,
        membershipIds,
        total: totalAmount
      })
    } catch (txError) {
      await rollback(connection)
      connection.release()
      console.error('Checkout transaction failed:', txError)
      if (txError?.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'Checkout references missing related data. Please contact support.' })
      }
      return res.status(500).json({ message: 'Unable to complete checkout' })
    }
  } catch (error) {
    console.error('Checkout failed:', error)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
