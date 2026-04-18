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

export default db