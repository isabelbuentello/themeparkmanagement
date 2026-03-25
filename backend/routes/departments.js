import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all departments
router.get('/', (req, res) => {
  db.query(
    `SELECT d.*, r.ride_name, v.venue_name
     FROM Department d
     LEFT JOIN Ride r ON d.ride_id = r.ride_id
     LEFT JOIN Venue v ON d.venue_id = v.venue_id
     ORDER BY d.department_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST create department
router.post('/', (req, res) => {
  const { department_name, ride_id, venue_id } = req.body;

  db.query(
    'INSERT INTO Department (department_name, ride_id, venue_id) VALUES (?, ?, ?)',
    [department_name, ride_id, venue_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ department_id: result.insertId });
    }
  );
});

// DELETE department
router.delete('/:id', (req, res) => {
  db.query(
    'DELETE FROM Department WHERE department_id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Department deleted' });
    }
  );
});

export default router;