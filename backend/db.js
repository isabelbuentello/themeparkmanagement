import mysql from 'mysql2'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const db = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
})

db.query('SELECT 1', (err) => {
  if (err) {
    console.error('MySQL connection error:', err.message)
    return
  }
  console.log('MySQL connected')
})

function resetMaintenanceRequestTrigger() {
  db.query('DROP TRIGGER IF EXISTS trg_maintenance_update_ride_status', (dropErr) => {
    if (dropErr) {
      console.error('MaintenanceRequest trigger reset failed:', dropErr.message)
      return
    }

    db.query(
      `CREATE TRIGGER trg_maintenance_update_ride_status
       AFTER INSERT ON MaintenanceRequest
       FOR EACH ROW
       BEGIN
         UPDATE Ride
         SET status_ride = 'broken'
         WHERE ride_id = NEW.ride_id;
       END`,
      (createErr) => {
        if (createErr) {
          console.error('MaintenanceRequest trigger creation failed:', createErr.message)
          return
        }

        console.log('MaintenanceRequest trigger reset')
      }
    )
  })
}

function ensureMaintenanceRequestTrigger() {
  db.query(
    `SELECT EVENT_OBJECT_TABLE, ACTION_STATEMENT
     FROM information_schema.TRIGGERS
     WHERE TRIGGER_SCHEMA = DATABASE()
       AND TRIGGER_NAME = 'trg_maintenance_update_ride_status'
     LIMIT 1`,
    (err, rows) => {
      if (err) {
        console.error('MaintenanceRequest trigger check failed:', err.message)
        return
      }

      const expectedAction =
        "BEGIN\n         UPDATE Ride\n         SET status_ride = 'broken'\n         WHERE ride_id = NEW.ride_id;\n       END"

      if (rows.length === 0) {
        resetMaintenanceRequestTrigger()
        return
      }

      const row = rows[0]
      const currentTable = (row.EVENT_OBJECT_TABLE || '').trim()
      const currentAction = (row.ACTION_STATEMENT || '').replace(/\s+/g, ' ').trim()
      const desiredAction = expectedAction.replace(/\s+/g, ' ').trim()

      if (currentTable !== 'MaintenanceRequest' || currentAction !== desiredAction) {
        resetMaintenanceRequestTrigger()
        return
      }

      console.log('MaintenanceRequest trigger already up to date')
    }
  )
}

db.query(
  `SELECT COLUMN_NAME
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'MaintenanceRequest'
     AND COLUMN_NAME IN ('cost_to_repair', 'cost_recorded_time')`,
  (err, rows) => {
    if (err) {
      console.error('MaintenanceRequest schema check failed:', err.message)
      return
    }

    const existingColumns = new Set(rows.map((row) => row.COLUMN_NAME))
    const missingColumns = []

    if (!existingColumns.has('cost_to_repair')) {
      missingColumns.push('ADD COLUMN cost_to_repair DECIMAL(10,2) NULL AFTER assigned_to_employee_id')
    }

    if (!existingColumns.has('cost_recorded_time')) {
      missingColumns.push('ADD COLUMN cost_recorded_time DATETIME NULL AFTER cost_to_repair')
    }

    if (missingColumns.length === 0) {
      ensureMaintenanceRequestTrigger()
      return
    }

    db.query(
      `ALTER TABLE MaintenanceRequest
       ${missingColumns.join(',\n       ')}`,
      (alterErr) => {
        if (alterErr) {
          console.error('MaintenanceRequest schema migration failed:', alterErr.message)
          return
        }

        console.log('MaintenanceRequest repair cost columns added')
        ensureMaintenanceRequestTrigger()
      }
    )
  }
)

export default db