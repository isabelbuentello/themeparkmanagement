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

function getForeignKeyErrorMessage(err) {
	if (err?.code !== 'ER_NO_REFERENCED_ROW_2') return null

	const sqlMessage = (err.sqlMessage || '').toLowerCase()

	if (
		sqlMessage.includes('ride_id') ||
		sqlMessage.includes('maintenancerequest_ibfk_1') ||
		sqlMessage.includes('maintenancelog_ibfk_1') ||
		sqlMessage.includes('trainingapprovalrequest_ibfk_2')
	) {
		return 'Invalid ride ID'
	}

	if (
		sqlMessage.includes('employee_id') ||
		sqlMessage.includes('submitted_by_employee_id') ||
		sqlMessage.includes('assigned_to_employee_id') ||
		sqlMessage.includes('maintenancerequest_ibfk_2') ||
		sqlMessage.includes('maintenancerequest_ibfk_3') ||
		sqlMessage.includes('maintenancelog_ibfk_2') ||
		sqlMessage.includes('trainingapprovalrequest_ibfk_1') ||
		sqlMessage.includes('trainingapprovalrequest_ibfk_3')
	) {
		return 'Invalid employee ID'
	}

	return 'Invalid employee ID or ride ID'
}

router.get(
	'/broken',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT ride_id, ride_name, status_ride
			 FROM Ride
			 WHERE status_ride IN ('broken', 'maintenance')
			 ORDER BY ride_name`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

router.get(
	'/overview',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
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

router.get(
	'/requests',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT mr.request_id, mr.ride_id, r.ride_name, mr.submitted_by_employee_id,
			        mr.issue_description, mr.priority, mr.status_request,
			        mr.assigned_to_employee_id, mr.created_time, mr.updated_time
			 FROM MaintenanceRequest mr
			 JOIN Ride r ON mr.ride_id = r.ride_id
			 ORDER BY mr.created_time DESC`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

router.post(
	'/requests',
	verifyToken,
	requireRole('maintenance', 'general_manager', 'ride_attendant_manager'),
	(req, res) => {
		const { ride_id, issue_description } = req.body
		const priority = req.body.priority || 'medium'
		const submitted_by_employee_id = req.user.id

		if (!ride_id || !issue_description) {
			return res.status(400).json({ message: 'ride_id and issue_description are required' })
		}

		db.query(
			`INSERT INTO MaintenanceRequest
			 (ride_id, submitted_by_employee_id, issue_description, priority)
			 VALUES (?, ?, ?, ?)`,
			[ride_id, submitted_by_employee_id, issue_description, priority],
			(err, result) => {
				if (err) {
					const fkMessage = getForeignKeyErrorMessage(err)
					if (fkMessage) return res.status(400).json({ message: fkMessage })
					return res.status(500).json({ message: 'Server error' })
				}
				res.status(201).json({ message: 'Request created', request_id: result.insertId })
			}
		)
	}
)

router.patch(
	'/requests/:id',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	(req, res) => {
		const { id } = req.params
		const { status_request, assigned_to_employee_id } = req.body
		const allowedStatuses = ['new', 'assigned', 'in_progress', 'resolved']

		if (status_request && !allowedStatuses.includes(status_request)) {
			return res.status(400).json({ message: 'Invalid status_request' })
		}

		db.query(
			`SELECT status_request
			        , assigned_to_employee_id
			 FROM MaintenanceRequest
			 WHERE request_id = ?`,
			[id],
			(selErr, rows) => {
				if (selErr) return res.status(500).json({ message: 'Server error' })
				if (rows.length === 0) return res.status(404).json({ message: 'Request not found' })
				if (rows[0].status_request === 'resolved') {
					return res.status(400).json({ message: 'Resolved requests cannot be modified' })
				}

				const current = rows[0]
				const nextAssignedEmployeeId =
					assigned_to_employee_id !== undefined && assigned_to_employee_id !== null
						? assigned_to_employee_id
						: current.assigned_to_employee_id

				let nextStatusRequest = status_request || current.status_request
				if (nextAssignedEmployeeId && nextStatusRequest === 'new') {
					nextStatusRequest = 'assigned'
				}

				db.query(
					`UPDATE MaintenanceRequest
					 SET status_request = ?,
					     assigned_to_employee_id = ?
					 WHERE request_id = ?`,
					[nextStatusRequest, nextAssignedEmployeeId || null, id],
					(err, result) => {
						if (err) {
							const fkMessage = getForeignKeyErrorMessage(err)
							if (fkMessage) return res.status(400).json({ message: fkMessage })
							return res.status(500).json({ message: 'Server error' })
						}
						if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' })
						res.json({ message: 'Request updated' })
					}
				)
			}
		)
	}
)

router.get(
	'/logs',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT ml.log_id, ml.ride_id, r.ride_name, ml.employee_id,
			        ml.issue_description, ml.status_maintenance, ml.cost_to_repair,
			        ml.reported_time, ml.fixed_time
			 FROM MaintenanceLog ml
			 JOIN Ride r ON ml.ride_id = r.ride_id
			 ORDER BY ml.reported_time DESC`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

router.post(
	'/logs',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	(req, res) => {
		const { ride_id, issue_description } = req.body
		const status_maintenance = req.body.status_maintenance || 'broken'
		const employee_id = req.user.id

		if (!ride_id || !issue_description) {
			return res.status(400).json({ message: 'ride_id and issue_description are required' })
		}

		db.query(
			`INSERT INTO MaintenanceLog
			 (ride_id, employee_id, issue_description, status_maintenance, reported_time)
			 VALUES (?, ?, ?, ?, NOW())`,
			[ride_id, employee_id, issue_description, status_maintenance],
			(err, result) => {
				if (err) {
					const fkMessage = getForeignKeyErrorMessage(err)
					if (fkMessage) return res.status(400).json({ message: fkMessage })
					return res.status(500).json({ message: 'Server error' })
				}

				// query what the trigger just set the ride status to
				db.query(
					'SELECT ride_name, status_ride FROM Ride WHERE ride_id = ?',
					[ride_id],
					(err, rows) => {
						if (err || rows.length === 0) {
							return res.status(201).json({ message: 'Log created', log_id: result.insertId })
						}
						res.status(201).json({
							message: 'Log created',
							log_id: result.insertId,
							trigger_update: {
								ride_name: rows[0].ride_name,
								new_status: rows[0].status_ride
							}
						})
					}
				)
			}
		)
	}
)

router.get(
	'/training-requests',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	(req, res) => {
		db.query(
			`SELECT tr.training_request_id, tr.employee_id, e.full_name,
			        tr.ride_id, r.ride_name, tr.requested_level,
			        tr.status_training_request, tr.requested_time,
			        tr.reviewed_by_employee_id, tr.reviewed_time
			 FROM TrainingApprovalRequest tr
			 JOIN Employee e ON tr.employee_id = e.employee_id
			 JOIN Ride r ON tr.ride_id = r.ride_id
			 ORDER BY tr.requested_time DESC`,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

router.post(
	'/training-requests',
	verifyToken,
	requireRole('maintenance', 'general_manager', 'ride_attendant_manager'),
	(req, res) => {
		const { employee_id, ride_id, requested_level } = req.body

		if (!employee_id || !ride_id || !requested_level) {
			return res.status(400).json({ message: 'employee_id, ride_id, and requested_level are required' })
		}

		db.query(
			`INSERT INTO TrainingApprovalRequest (employee_id, ride_id, requested_level)
			 VALUES (?, ?, ?)`,
			[employee_id, ride_id, requested_level],
			(err, result) => {
				if (err) {
					const fkMessage = getForeignKeyErrorMessage(err)
					if (fkMessage) return res.status(400).json({ message: fkMessage })
					return res.status(500).json({ message: 'Server error' })
				}
				res.status(201).json({ message: 'Training request created', training_request_id: result.insertId })
			}
		)
	}
)

router.patch(
	'/training-requests/:id/review',
	verifyToken,
	requireRole('general_manager', 'maintenance'),
	(req, res) => {
		const { id } = req.params
		const { status_training_request } = req.body
		const reviewer_id = req.user.id
		const allowedStatuses = ['approved', 'rejected']

		if (!allowedStatuses.includes(status_training_request)) {
			return res.status(400).json({ message: 'Invalid status_training_request' })
		}

		db.beginTransaction((txErr) => {
			if (txErr) return res.status(500).json({ message: 'Server error' })

			db.query(
				`UPDATE TrainingApprovalRequest
				 SET status_training_request = ?, reviewed_by_employee_id = ?, reviewed_time = NOW()
				 WHERE training_request_id = ?`,
				[status_training_request, reviewer_id, id],
				(err, result) => {
					if (err) {
						return db.rollback(() => res.status(500).json({ message: 'Server error' }))
					}

					if (result.affectedRows === 0) {
						return db.rollback(() => res.status(404).json({ message: 'Training request not found' }))
					}

					if (status_training_request !== 'approved') {
						return db.commit((commitErr) => {
							if (commitErr) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
							res.json({ message: 'Training request reviewed' })
						})
					}

					db.query(
						`SELECT employee_id, ride_id, requested_level
						 FROM TrainingApprovalRequest
						 WHERE training_request_id = ?`,
						[id],
						(selErr, rows) => {
							if (selErr || rows.length === 0) {
								return db.rollback(() => res.status(500).json({ message: 'Server error' }))
							}

							const row = rows[0]
							db.query(
								`INSERT INTO EmployeeRideTraining (employee_id, ride_id, trained_level, trained_date)
								 VALUES (?, ?, ?, CURDATE())
								 ON DUPLICATE KEY UPDATE
								 trained_level = VALUES(trained_level),
								 trained_date = VALUES(trained_date)`,
								[row.employee_id, row.ride_id, row.requested_level],
								(upErr) => {
									if (upErr) {
										return db.rollback(() => res.status(500).json({ message: 'Server error' }))
									}

									db.commit((commitErr) => {
										if (commitErr) return db.rollback(() => res.status(500).json({ message: 'Server error' }))
										res.json({ message: 'Training request approved and training record updated' })
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
	'/queue/:rideId/reservations',
	verifyToken,
	requireRole('ride_attendant_manager', 'maintenance', 'general_manager'),
	(req, res) => {
		const { rideId } = req.params

		db.query(
			`SELECT qr.reservation_id, qr.customer_id, qr.reservation_time, qr.reservation_fulfilled
			 FROM VirtualQueue vq
			 JOIN QueueReservation qr ON qr.queue_id = vq.queue_id
			 WHERE vq.ride_id = ?
			 ORDER BY qr.reservation_time DESC`,
			[rideId],
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

export default router
