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
		const { rideType, status, sort } = req.query
		const whereClauses = []
		const queryParams = []

		if (rideType && rideType !== 'all') {
			whereClauses.push('ride_type = ?')
			queryParams.push(rideType)
		}

		if (status && status !== 'all') {
			whereClauses.push('status_ride = ?')
			queryParams.push(status)
		}

		const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''
		const orderSql = sort === 'desc' ? 'ORDER BY ride_name DESC' : 'ORDER BY ride_name ASC'

		db.query(
			`SELECT ride_id, ride_name, ride_type, status_ride, affected_by_rain
			 FROM Ride
			 ${whereSql}
			 ${orderSql}`,
			queryParams,
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
		const { status, priority, assignment } = req.query
		const whereClauses = []
		const queryParams = []

		if (status && status !== 'all') {
			whereClauses.push('mr.status_request = ?')
			queryParams.push(status)
		}

		if (priority && priority !== 'all') {
			whereClauses.push('mr.priority = ?')
			queryParams.push(priority)
		}

		if (assignment === 'assigned') {
			whereClauses.push('mr.assigned_to_employee_id IS NOT NULL')
		}

		if (assignment === 'unassigned') {
			whereClauses.push('mr.assigned_to_employee_id IS NULL')
		}

		const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

		db.query(
			`SELECT mr.request_id, mr.ride_id, r.ride_name, mr.submitted_by_employee_id,
			        mr.issue_description, mr.priority, mr.status_request,
			        mr.assigned_to_employee_id, mr.cost_to_repair, mr.cost_recorded_time,
			        mr.created_time, mr.updated_time
			 FROM MaintenanceRequest mr
			 JOIN Ride r ON mr.ride_id = r.ride_id
			 ${whereSql}
			 ORDER BY mr.created_time DESC`,
			queryParams,
			(err, results) => {
				if (err) return res.status(500).json({ message: 'Server error' })
				res.json(results)
			}
		)
	}
)

router.get(
	'/report',
	verifyToken,
	requireRole('maintenance', 'general_manager'),
	async (req, res) => {
		const { start, end, month, year, rideId, status, priority } = req.query
		const whereClauses = []
		const params = []

		if (start) {
			whereClauses.push('DATE(mr.created_time) >= ?')
			params.push(start)
		}

		if (end) {
			whereClauses.push('DATE(mr.created_time) <= ?')
			params.push(end)
		}

		if (month && month !== 'all') {
			whereClauses.push('MONTH(mr.created_time) = ?')
			params.push(month)
		}

		if (year && year !== 'all') {
			whereClauses.push('YEAR(mr.created_time) = ?')
			params.push(year)
		}

		if (rideId && rideId !== 'all') {
			whereClauses.push('mr.ride_id = ?')
			params.push(rideId)
		}

		if (status && status !== 'all') {
			whereClauses.push('mr.status_request = ?')
			params.push(status)
		}

		if (priority && priority !== 'all') {
			whereClauses.push('mr.priority = ?')
			params.push(priority)
		}

		const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

		try {
			const [summaryRows, mostMaintenancedRideRows, frequencyByRideRows, frequencyByDayRows, recordsRows] = await Promise.all([
				query(
					`
						SELECT
							COUNT(*) AS total_maintenance,
							SUM(CASE WHEN mr.status_request = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
							AVG(CASE
								WHEN mr.status_request = 'resolved'
								THEN TIMESTAMPDIFF(MINUTE, mr.created_time, mr.updated_time)
								ELSE NULL
							END) AS avg_resolution_minutes,
							SUM(COALESCE(mr.cost_to_repair, 0)) AS total_spent
						FROM MaintenanceRequest mr
						${whereSql}
					`,
					params
				),
				query(
					`
						SELECT
							mr.ride_id,
							r.ride_name,
							COUNT(*) AS maintenance_count,
							SUM(COALESCE(mr.cost_to_repair, 0)) AS total_spent
						FROM MaintenanceRequest mr
						JOIN Ride r ON r.ride_id = mr.ride_id
						${whereSql}
						GROUP BY mr.ride_id, r.ride_name
						ORDER BY maintenance_count DESC, total_spent DESC, r.ride_name
						LIMIT 1
					`,
					params
				),
				query(
					`
						SELECT
							mr.ride_id,
							r.ride_name,
							COUNT(*) AS maintenance_count,
							SUM(COALESCE(mr.cost_to_repair, 0)) AS total_spent,
							AVG(CASE
								WHEN mr.status_request = 'resolved'
								THEN TIMESTAMPDIFF(MINUTE, mr.created_time, mr.updated_time)
								ELSE NULL
							END) AS avg_resolution_minutes
						FROM MaintenanceRequest mr
						JOIN Ride r ON r.ride_id = mr.ride_id
						${whereSql}
						GROUP BY mr.ride_id, r.ride_name
						ORDER BY maintenance_count DESC, r.ride_name
					`,
					params
				),
				query(
					`
						SELECT
							DATE(mr.created_time) AS maintenance_date,
							COUNT(*) AS maintenance_count,
							SUM(COALESCE(mr.cost_to_repair, 0)) AS total_spent
						FROM MaintenanceRequest mr
						${whereSql}
						GROUP BY DATE(mr.created_time)
						ORDER BY maintenance_date DESC
					`,
					params
				),
				query(
					`
						SELECT
							mr.request_id,
							mr.ride_id,
							r.ride_name,
							r.status_ride AS current_ride_status,
							mr.issue_description,
							mr.priority,
							mr.status_request,
							mr.assigned_to_employee_id,
							e.full_name AS assigned_employee_name,
							mr.cost_to_repair,
							mr.created_time,
							mr.updated_time,
							CASE
								WHEN mr.status_request = 'resolved'
								THEN TIMESTAMPDIFF(MINUTE, mr.created_time, mr.updated_time)
								ELSE NULL
							END AS resolution_minutes
						FROM MaintenanceRequest mr
						JOIN Ride r ON r.ride_id = mr.ride_id
						LEFT JOIN Employee e ON mr.assigned_to_employee_id = e.employee_id
						${whereSql}
						ORDER BY mr.created_time DESC, mr.request_id DESC
					`,
					params
				)
			])

			const summary = summaryRows[0] || {
				total_maintenance: 0,
				resolved_count: 0,
				avg_resolution_minutes: null,
				total_spent: 0
			}

			res.json({
				summary,
				mostMaintenancedRide: mostMaintenancedRideRows[0] || null,
				frequencyByRide: frequencyByRideRows,
				frequencyByDay: frequencyByDayRows,
				records: recordsRows
			})
		} catch (err) {
			console.error('Failed to load maintenance report:', err)
			res.status(500).json({ message: 'Server error' })
		}
	}
)

router.post(
	'/requests',
	verifyToken,
	requireRole('maintenance', 'general_manager', 'ride_attendant_manager'),
	(req, res) => {
		const { ride_id, issue_description } = req.body
		const priority = req.body.priority || 'medium'
			const costToRepair = req.body.cost_to_repair
			const parsedCostToRepair =
				costToRepair === '' || costToRepair === undefined || costToRepair === null
					? null
					: Number(costToRepair)
		const submitted_by_employee_id = req.user.id

		if (!ride_id || !issue_description) {
			return res.status(400).json({ message: 'ride_id and issue_description are required' })
		}

			if (parsedCostToRepair !== null && (!Number.isFinite(parsedCostToRepair) || parsedCostToRepair < 0)) {
				return res.status(400).json({ message: 'cost_to_repair must be a non-negative number' })
			}

		db.query(
			`INSERT INTO MaintenanceRequest
				 (ride_id, submitted_by_employee_id, issue_description, priority, cost_to_repair, cost_recorded_time)
				 VALUES (?, ?, ?, ?, ?, ?)`,
				[
					ride_id,
					submitted_by_employee_id,
					issue_description,
					priority,
					parsedCostToRepair,
					parsedCostToRepair !== null ? new Date() : null
				],
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
			const { status_request, assigned_to_employee_id, cost_to_repair } = req.body
		const allowedStatuses = ['new', 'assigned', 'in_progress', 'resolved']
			const parsedCostToRepair =
				cost_to_repair === '' || cost_to_repair === undefined || cost_to_repair === null
					? undefined
					: Number(cost_to_repair)

		if (status_request && !allowedStatuses.includes(status_request)) {
			return res.status(400).json({ message: 'Invalid status_request' })
		}

			if (parsedCostToRepair !== undefined && (!Number.isFinite(parsedCostToRepair) || parsedCostToRepair < 0)) {
				return res.status(400).json({ message: 'cost_to_repair must be a non-negative number' })
			}

		db.query(
			`SELECT status_request
			        , assigned_to_employee_id
				        , cost_to_repair
				        , cost_recorded_time
			 FROM MaintenanceRequest
			 WHERE request_id = ?`,
			[id],
			(selErr, rows) => {
				if (selErr) return res.status(500).json({ message: 'Server error' })
				if (rows.length === 0) return res.status(404).json({ message: 'Request not found' })

				const current = rows[0]
				const nextAssignedEmployeeId =
					assigned_to_employee_id !== undefined && assigned_to_employee_id !== null
						? assigned_to_employee_id
						: current.assigned_to_employee_id
				const nextCostToRepair =
					parsedCostToRepair !== undefined ? parsedCostToRepair : current.cost_to_repair

				let nextStatusRequest = status_request || current.status_request
				if (nextAssignedEmployeeId && nextStatusRequest === 'new') {
					nextStatusRequest = 'assigned'
				}

				if (
					current.status_request === 'resolved' &&
					(nextStatusRequest !== current.status_request || nextAssignedEmployeeId !== current.assigned_to_employee_id)
				) {
					return res.status(400).json({ message: 'Resolved requests cannot be modified' })
				}

				db.query(
					`UPDATE MaintenanceRequest
					 SET status_request = ?,
					     assigned_to_employee_id = ?,
					     cost_to_repair = ?,
					     cost_recorded_time = CASE
					       WHEN ? IS NULL THEN NULL
					       WHEN cost_recorded_time IS NULL THEN NOW()
					       ELSE cost_recorded_time
					     END
					 WHERE request_id = ?`,
					[nextStatusRequest, nextAssignedEmployeeId || null, nextCostToRepair ?? null, nextCostToRepair ?? null, id],
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
		const { status } = req.query
		const whereSql = status && status !== 'all' ? 'WHERE ml.status_maintenance = ?' : ''
		const queryParams = status && status !== 'all' ? [status] : []

		db.query(
			`SELECT ml.log_id, ml.ride_id, r.ride_name, ml.employee_id,
			        ml.issue_description, ml.status_maintenance, ml.cost_to_repair,
			        ml.reported_time, ml.fixed_time
			 FROM MaintenanceLog ml
			 JOIN Ride r ON ml.ride_id = r.ride_id
			 ${whereSql}
			 ORDER BY ml.reported_time DESC`,
			queryParams,
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

		db.getConnection((connErr, connection) => {
			if (connErr) return res.status(500).json({ message: 'Server error' })

			connection.beginTransaction((txErr) => {
				if (txErr) {
					connection.release()
					return res.status(500).json({ message: 'Server error' })
				}

				connection.query(
				`UPDATE TrainingApprovalRequest
				 SET status_training_request = ?, reviewed_by_employee_id = ?, reviewed_time = NOW()
				 WHERE training_request_id = ?`,
				[status_training_request, reviewer_id, id],
				(err, result) => {
					if (err) {
						return connection.rollback(() => {
							connection.release()
							res.status(500).json({ message: 'Server error' })
						})
					}

					if (result.affectedRows === 0) {
						return connection.rollback(() => {
							connection.release()
							res.status(404).json({ message: 'Training request not found' })
						})
					}

					if (status_training_request !== 'approved') {
						return connection.commit((commitErr) => {
							if (commitErr) {
								return connection.rollback(() => {
									connection.release()
									res.status(500).json({ message: 'Server error' })
								})
							}
							connection.release()
							res.json({ message: 'Training request reviewed' })
						})
					}

					connection.query(
						`SELECT employee_id, ride_id, requested_level
						 FROM TrainingApprovalRequest
						 WHERE training_request_id = ?`,
						[id],
						(selErr, rows) => {
							if (selErr || rows.length === 0) {
								return connection.rollback(() => {
									connection.release()
									res.status(500).json({ message: 'Server error' })
								})
							}

							const row = rows[0]
							connection.query(
								`INSERT INTO EmployeeRideTraining (employee_id, ride_id, trained_level, trained_date)
								 VALUES (?, ?, ?, CURDATE())
								 ON DUPLICATE KEY UPDATE
								 trained_level = VALUES(trained_level),
								 trained_date = VALUES(trained_date)`,
								[row.employee_id, row.ride_id, row.requested_level],
								(upErr) => {
									if (upErr) {
										return connection.rollback(() => {
											connection.release()
											res.status(500).json({ message: 'Server error' })
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
										res.json({ message: 'Training request approved and training record updated' })
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
