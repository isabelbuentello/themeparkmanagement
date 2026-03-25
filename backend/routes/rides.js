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

router.get(
	'/',
	verifyToken,
	requireRole('ride_attendant_manager', 'maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT ride_id, ride_name, status_ride, affected_by_rain
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

// GM can view full ride details
router.get(
	'/all',
	verifyToken,
	requireRole('general_manager'),
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

		db.beginTransaction((txErr) => {
			if (txErr) return res.status(500).json({ message: 'Server error' })

			db.query(
				'INSERT INTO RideRainout (ride_id, rainout_time) VALUES (?, NOW())',
				[id],
				(insertErr) => {
					if (insertErr) {
						return db.rollback(() => {
							res.status(500).json({ message: 'Error logging rainout' })
						})
					}

					db.query(
						"UPDATE Ride SET status_ride = 'closed_weather' WHERE ride_id = ?",
						[id],
						(updateErr, result) => {
							if (updateErr) {
								return db.rollback(() => {
									res.status(500).json({ message: 'Error updating ride status' })
								})
							}

							if (result.affectedRows === 0) {
								return db.rollback(() => {
									res.status(404).json({ message: 'Ride not found' })
								})
							}

							db.commit((commitErr) => {
								if (commitErr) {
									return db.rollback(() => {
										res.status(500).json({ message: 'Server error' })
									})
								}

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
