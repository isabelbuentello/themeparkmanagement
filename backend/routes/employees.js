import express from 'express';
import db from '../db.js';

const router = express.Router();

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const inputDate = new Date(dateStr);
  if (Number.isNaN(inputDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  return inputDate > today;
}

function isPastDate(dateStr) {
  if (!dateStr) return false;
  const inputDate = new Date(dateStr);
  if (Number.isNaN(inputDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  return inputDate < today;
}

// GET all employees
router.get('/', (req, res) => {
  db.query(
    `SELECT e.*, d.department_name, ea.account_id, ea.username
     FROM Employee e
     JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN EmployeeAccount ea ON e.employee_id = ea.employee_id
     ORDER BY e.full_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET single employee
router.get('/:id', (req, res) => {
  db.query(
    `SELECT e.*, d.department_name, ea.account_id, ea.username
     FROM Employee e
     JOIN Department d ON e.department_id = d.department_id
     LEFT JOIN EmployeeAccount ea ON e.employee_id = ea.employee_id
     WHERE e.employee_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
      res.json(rows[0]);
    }
  );
});

// POST create employee
router.post('/', (req, res) => {
  const {
    full_name, role, pay_rate, start_date, department_id,
    employee_phone, employee_email, employee_address,
    gender, employee_birthdate, ssn
  } = req.body;

  if (isFutureDate(employee_birthdate)) {
    return res.status(400).json({ error: 'Birthdate cannot be in the future' });
  }

  if (isPastDate(start_date)) {
    return res.status(400).json({ error: 'Start date cannot be in the past' });
  }

  db.query(
    `INSERT INTO Employee 
     (full_name, role, pay_rate, start_date, department_id,
      employee_phone, employee_email, employee_address,
      gender, employee_birthdate, ssn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [full_name, role, pay_rate, start_date, department_id,
     employee_phone, employee_email, employee_address,
     gender, employee_birthdate, ssn],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ employee_id: result.insertId });
    }
  );
});

// PUT update employee
router.put('/:id', (req, res) => {
  const {
    full_name, role, pay_rate, department_id,
    employee_phone, employee_email, employee_address
  } = req.body;

  db.query(
    `UPDATE Employee 
     SET full_name = ?, role = ?, pay_rate = ?, department_id = ?,
         employee_phone = ?, employee_email = ?, employee_address = ?
     WHERE employee_id = ?`,
    [full_name, role, pay_rate, department_id,
     employee_phone, employee_email, employee_address, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Employee updated' });
    }
  );
});

// DELETE employee
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM EmployeeAccount WHERE employee_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.query('DELETE FROM Employee WHERE employee_id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Employee terminated' });
    });
  });
});

// POST create employee account
router.post('/:id/account', (req, res) => {
  const { username, password } = req.body;

  db.query(
    'INSERT INTO EmployeeAccount (employee_id, username, password) VALUES (?, ?, ?)',
    [req.params.id, username, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ account_id: result.insertId });
    }
  );
});

// DELETE employee account
router.delete('/:id/account', (req, res) => {
  db.query('DELETE FROM EmployeeAccount WHERE employee_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Account deleted' });
  });
});

export default router;
