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

function getCustomerIdFromTokenUser(userId, callback) {
	db.query(
		'SELECT customer_id FROM Account WHERE account_id = ?',
		[userId],
		(err, results) => {
			if (err) return callback(err)
			if (results.length === 0) return callback(null, null)
			callback(null, results[0].customer_id)
		}
	)
}

router.get('/customer/queues', verifyToken, requireRole('customer'), (req, res) => {
	getCustomerIdFromTokenUser(req.user.id, (customerLookupErr, customerId) => {
		if (customerLookupErr) return res.status(500).json({ message: 'Server error' })
		if (!customerId) return res.status(404).json({ message: 'Customer account not found' })

		db.query(
			`SELECT r.ride_id,
			        r.ride_name,
			        r.status_ride,
			        vq.queue_id,
			        SUM(CASE WHEN qr.reservation_fulfilled = 0 THEN 1 ELSE 0 END) AS pending_reservations,
			        myqr.reservation_id AS my_reservation_id,
			        myqr.reservation_time AS my_reservation_time,
			        myqr.reservation_fulfilled AS my_reservation_fulfilled
			 FROM VirtualQueue vq
			 JOIN Ride r ON r.ride_id = vq.ride_id
			 LEFT JOIN QueueReservation qr ON qr.queue_id = vq.queue_id
			 LEFT JOIN QueueReservation myqr
			   ON myqr.queue_id = vq.queue_id
			  AND myqr.customer_id = ?
			  AND myqr.reservation_fulfilled = 0
			 GROUP BY r.ride_id, r.ride_name, r.status_ride, vq.queue_id,
			          myqr.reservation_id, myqr.reservation_time, myqr.reservation_fulfilled
			 ORDER BY r.ride_name`,
			[customerId],
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	})
})

router.post('/customer/queues/:rideId/join', verifyToken, requireRole('customer'), (req, res) => {
	const { rideId } = req.params

	getCustomerIdFromTokenUser(req.user.id, (customerLookupErr, customerId) => {
		if (customerLookupErr) return res.status(500).json({ message: 'Server error' })
		if (!customerId) return res.status(404).json({ message: 'Customer account not found' })

		db.query(
			`SELECT vq.queue_id, r.ride_name, r.status_ride
			 FROM VirtualQueue vq
			 JOIN Ride r ON r.ride_id = vq.ride_id
			 WHERE vq.ride_id = ?`,
			[rideId],
			(queueErr, queueRows) => {
				if (queueErr) return res.status(500).json({ message: 'Server error' })
				if (queueRows.length === 0) {
					return res.status(404).json({ message: 'This ride does not have a virtual queue' })
				}

				const queue = queueRows[0]
				if (queue.status_ride !== 'open') {
					return res.status(400).json({ message: 'Ride is currently not open for queue reservations' })
				}

				db.query(
					`SELECT reservation_id
					 FROM QueueReservation
					 WHERE queue_id = ? AND customer_id = ? AND reservation_fulfilled = 0
					 LIMIT 1`,
					[queue.queue_id, customerId],
					(existingErr, existingRows) => {
						if (existingErr) return res.status(500).json({ message: 'Server error' })
						if (existingRows.length > 0) {
							return res.status(409).json({ message: 'You already have a pending reservation for this queue' })
						}

						db.query(
							`INSERT INTO QueueReservation (queue_id, customer_id, reservation_time, reservation_fulfilled)
							 VALUES (?, ?, NOW(), 0)`,
							[queue.queue_id, customerId],
							(insertErr, insertResult) => {
								if (insertErr) return res.status(500).json({ message: 'Server error' })
								res.status(201).json({
									message: 'Reservation created',
									reservation_id: insertResult.insertId,
									ride_id: Number(rideId),
									ride_name: queue.ride_name
								})
							}
						)
					}
				)
			}
		)
	})
})

router.delete('/customer/reservations/:reservationId', verifyToken, requireRole('customer'), (req, res) => {
	const { reservationId } = req.params

	getCustomerIdFromTokenUser(req.user.id, (customerLookupErr, customerId) => {
		if (customerLookupErr) return res.status(500).json({ message: 'Server error' })
		if (!customerId) return res.status(404).json({ message: 'Customer account not found' })

		db.query(
			`DELETE FROM QueueReservation
			 WHERE reservation_id = ? AND customer_id = ? AND reservation_fulfilled = 0`,
			[reservationId, customerId],
			(err, result) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				if (result.affectedRows === 0) {
					return res.status(404).json({ message: 'Reservation not found, already fulfilled, or not owned by customer' })
				}

				res.json({
					message: 'Reservation canceled',
					reservation_id: Number(reservationId)
				})
			}
		)
	})
})

router.get(
	'/',
	verifyToken,
	requireRole('ride_attendant_manager', 'maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT ride_id, ride_name, ride_type, status_ride, affected_by_rain
			 FROM Ride
			 ORDER BY ride_name`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

// GM can add a new ride
router.post(
	'/',
	verifyToken,
	requireRole('general_manager'),
	(req, res) => {
		const { ride_name, ride_type, is_seasonal, size_sqft, ride_lat, ride_long,
		        speed_mph, min_height_ft, affected_by_rain, status_ride } = req.body

		if (!ride_name || !ride_type || !size_sqft || !ride_lat || !ride_long || !speed_mph || !min_height_ft || !status_ride) {
			return res.status(400).json({ message: 'All fields are required' })
		}

		db.query(
			`INSERT INTO Ride (ride_name, ride_type, is_seasonal, size_sqft, ride_lat, ride_long,
			  speed_mph, min_height_ft, affected_by_rain, status_ride)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[ride_name, ride_type, is_seasonal, size_sqft, ride_lat, ride_long,
			 speed_mph, min_height_ft, affected_by_rain, status_ride],
			(err) => {
				if (err) return res.status(500).json({ message: 'Error adding ride' })
				res.json({ message: 'Ride added successfully' })
			}
		)
	}
)

// PUBLIC ROUTE: Anyone can view full ride details
router.get(
	'/all',
	(req, res) => {
		db.query(
			'SELECT * FROM Ride ORDER BY ride_name',
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)


router.patch(
	'/:id/status',
	verifyToken,
	requireRole('ride_attendant_manager', 'maintenance', 'general_manager'),
	(req, res) => {
		const { id } = req.params
		const { status_ride } = req.body
		const allowedStatuses = ['open', 'broken', 'maintenance', 'closed_weather']

		if (!allowedStatuses.includes(status_ride)) {
			return res.status(400).json({ message: 'Invalid status_ride' })
		}

		db.query(
			'UPDATE Ride SET status_ride = ? WHERE ride_id = ?',
			[status_ride, id],
			(err, result) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				if (result.affectedRows === 0) {
					return res.status(404).json({ message: 'Ride not found' })
				}

				res.json({
					message: 'Ride status updated',
					ride_id: Number(id),
					status_ride
				})
			}
		)
	}
)

router.post(
	'/:id/rainout',
	verifyToken,
	requireRole('ride_attendant_manager', 'general_manager'),
	(req, res) => {
		const { id } = req.params

		db.getConnection((connErr, connection) => {
			if (connErr) return res.status(500).json({ message: 'Server error' })

			connection.beginTransaction((txErr) => {
				if (txErr) {
					connection.release()
					return res.status(500).json({ message: 'Server error' })
				}

				connection.query(
				'INSERT INTO RideRainout (ride_id, rainout_time) VALUES (?, NOW())',
				[id],
				(insertErr) => {
					if (insertErr) {
						return connection.rollback(() => {
							connection.release()
							res.status(500).json({ message: 'Error logging rainout' })
						})
					}

					connection.query(
						"UPDATE Ride SET status_ride = 'closed_weather' WHERE ride_id = ?",
						[id],
						(updateErr, result) => {
							if (updateErr) {
								return connection.rollback(() => {
									connection.release()
									res.status(500).json({ message: 'Error updating ride status' })
								})
							}

							if (result.affectedRows === 0) {
								return connection.rollback(() => {
									connection.release()
									res.status(404).json({ message: 'Ride not found' })
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

								res.json({
									message: 'Rainout logged and ride closed for weather',
									ride_id: Number(id)
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

router.get(
	'/rainouts',
	verifyToken,
	requireRole('general_manager', 'maintenance', 'ride_attendant_manager'),
	(req, res) => {
		db.query(
			`SELECT rr.rainout_id, rr.ride_id, rr.rainout_time, r.ride_name, r.status_ride
			 FROM RideRainout rr
			 JOIN Ride r ON rr.ride_id = r.ride_id
			 ORDER BY rr.rainout_time DESC`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)
router.get(
	'/queue-overview',
	verifyToken,
	requireRole('ride_attendant_manager', 'maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT r.ride_id, r.ride_name, vq.queue_id,
			        COUNT(qr.reservation_id) AS total_reservations,
			        SUM(CASE WHEN qr.reservation_fulfilled = 1 THEN 1 ELSE 0 END) AS fulfilled_reservations,
			        SUM(CASE WHEN qr.reservation_fulfilled = 0 THEN 1 ELSE 0 END) AS pending_reservations
			 FROM Ride r
			 LEFT JOIN VirtualQueue vq ON vq.ride_id = r.ride_id
			 LEFT JOIN QueueReservation qr ON qr.queue_id = vq.queue_id
			 GROUP BY r.ride_id, r.ride_name, vq.queue_id
			 ORDER BY r.ride_name`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

router.get(
	'/:id/reservations',
	verifyToken,
	requireRole('ride_attendant_manager', 'maintenance', 'general_manager'),
	(req, res) => {
		const { id } = req.params

		db.query(
			`SELECT qr.reservation_id, qr.customer_id, qr.reservation_time, qr.reservation_fulfilled
			 FROM VirtualQueue vq
			 JOIN QueueReservation qr ON qr.queue_id = vq.queue_id
			 WHERE vq.ride_id = ?
			 ORDER BY qr.reservation_time DESC`,
			[id],
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

export default router
