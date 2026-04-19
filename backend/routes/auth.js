import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
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

// checks that the logged in user has the required role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Access denied' })
    next()
  }
}

const router = express.Router()

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

router.post('/login', (req, res) => {
  const { username, password } = req.body

  // check customer accounts first
  db.query('SELECT * FROM Account WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' })

    if (results.length > 0) {
      const match = await bcrypt.compare(password, results[0].password)
      if (!match) return res.status(401).json({ message: 'Invalid credentials' })

      const token = jwt.sign(
        { id: results[0].account_id, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      )
      return res.json({ token, role: 'customer' })
    }

    // if not a customer, check employee accounts
    db.query(`
      SELECT ea.*, e.role 
      FROM EmployeeAccount ea 
      JOIN Employee e ON ea.employee_id = e.employee_id 
      WHERE ea.username = ?`,
      [username], async (err2, results2) => {
        if (err2) return res.status(500).json({ message: 'Server error' })
        if (results2.length === 0) return res.status(401).json({ message: 'Invalid credentials' })

        const match = await bcrypt.compare(password, results2[0].password)
        if (!match) return res.status(401).json({ message: 'Invalid credentials' })

        const token = jwt.sign(
          { id: results2[0].employee_id, role: results2[0].role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        )
        return res.json({ token, role: results2[0].role })
      })
      
  })
})

// CUSTOMER REGISTRATION - anyone can do this
// uses a transaction so both inserts succeed or both roll back
router.post('/register', async (req, res) => {
  const { username, password, first_name, last_name, 
          customer_email, customer_phone, customer_birthdate } = req.body

  try {
    const hash = await bcrypt.hash(password, 10)
    const connection = await getConnection()
    await beginTransaction(connection)

    try {
      const customerResult = await query(
        `INSERT INTO Customer (first_name, last_name, customer_birthdate, customer_phone, customer_email)
         VALUES (?, ?, ?, ?, ?)`,
        [first_name, last_name, customer_birthdate, customer_phone, customer_email],
        connection
      )

      await query(
        `INSERT INTO Account (customer_id, username, password, date_created)
         VALUES (?, ?, ?, CURDATE())`,
        [customerResult.insertId, username, hash],
        connection
      )

      await commit(connection)
      connection.release()
      return res.json({ message: 'Account created successfully' })
    } catch (txError) {
      await rollback(connection)
      connection.release()
      console.error('Register transaction failed:', txError)

      if (txError?.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username already taken' })
      }

      return res.status(500).json({ message: 'Error creating account' })
    }
  } catch (err) {
    console.error('Register route failed:', err)
    res.status(500).json({ message: 'Server error' })
  }
})


// EMPLOYEE REGISTRATION - managers only
// uses a transaction so both inserts succeed or both roll back
router.post('/register/employee', verifyToken, requireRole('general_manager'), async (req, res) => {
  const { username, password, full_name, role, pay_rate, 
          start_date, department_id, employee_phone, 
          employee_email, employee_address, gender, 
          employee_birthdate, ssn } = req.body

  try {
    const hash = await bcrypt.hash(password, 10)
    const connection = await getConnection()
    await beginTransaction(connection)

    try {
      const employeeResult = await query(
        `INSERT INTO Employee (full_name, role, pay_rate, start_date, department_id,
          employee_phone, employee_email, employee_address, gender, employee_birthdate, ssn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          full_name,
          role,
          pay_rate,
          start_date,
          department_id,
          employee_phone,
          employee_email,
          employee_address,
          gender,
          employee_birthdate,
          ssn
        ],
        connection
      )

      await query(
        `INSERT INTO EmployeeAccount (employee_id, username, password)
         VALUES (?, ?, ?)`,
        [employeeResult.insertId, username, hash],
        connection
      )

      await commit(connection)
      connection.release()
      return res.json({ message: 'Employee account created successfully' })
    } catch (txErr) {
      await rollback(connection)
      connection.release()

      if (txErr?.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username already taken' })
      }

      return res.status(500).json({ message: 'Error creating employee account' })
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router