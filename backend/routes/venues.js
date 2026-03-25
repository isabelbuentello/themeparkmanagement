import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all venues with their type-specific info
router.get('/', (req, res) => {
  db.query(
    `SELECT v.*,
            s.space_for_items_sqft, s.total_merch_sold,
            r.requires_booking, r.price_range, r.seating_capacity,
            ps.show_category, ps.duration
     FROM Venue v
     LEFT JOIN Shop s ON v.venue_id = s.venue_id
     LEFT JOIN Restaurant r ON v.venue_id = r.venue_id
     LEFT JOIN ParkShow ps ON v.venue_id = ps.venue_id
     ORDER BY v.venue_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET venues for dropdowns (just id, name, type)
router.get('/list', (req, res) => {
  db.query(
    'SELECT venue_id, venue_name, venue_type FROM Venue ORDER BY venue_name',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET single venue by ID
router.get('/:id', (req, res) => {
  db.query(
    `SELECT v.*,
            s.space_for_items_sqft, s.total_merch_sold,
            r.requires_booking, r.price_range, r.seating_capacity,
            ps.show_category, ps.duration
     FROM Venue v
     LEFT JOIN Shop s ON v.venue_id = s.venue_id
     LEFT JOIN Restaurant r ON v.venue_id = r.venue_id
     LEFT JOIN ParkShow ps ON v.venue_id = ps.venue_id
     WHERE v.venue_id = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Venue not found' });
      res.json(rows[0]);
    }
  );
});

// GET venue by name (for forms that need to look up by name)
router.get('/name/:name', (req, res) => {
  db.query(
    'SELECT * FROM Venue WHERE venue_name = ?',
    [req.params.name],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Venue not found' });
      res.json(rows[0]);
    }
  );
});

// POST create venue
router.post('/', (req, res) => {
  const { venue_type, venue_name, hours, venue_lat, venue_long } = req.body;

  db.query(
    'INSERT INTO Venue (venue_type, venue_name, hours, venue_lat, venue_long) VALUES (?, ?, ?, ?, ?)',
    [venue_type, venue_name, hours, venue_lat, venue_long],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const venueId = result.insertId;

      // Insert into type-specific table based on venue_type
      if (venue_type === 'shop') {
        const { space_for_items_sqft } = req.body;
        db.query(
          'INSERT INTO Shop (venue_id, space_for_items_sqft, total_merch_sold) VALUES (?, ?, 0)',
          [venueId, space_for_items_sqft || 0],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ venue_id: venueId });
          }
        );
      } else if (venue_type === 'restaurant') {
        const { requires_booking, price_range, seating_capacity } = req.body;
        db.query(
          'INSERT INTO Restaurant (venue_id, requires_booking, price_range, seating_capacity) VALUES (?, ?, ?, ?)',
          [venueId, requires_booking || false, price_range || 1, seating_capacity || 0],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ venue_id: venueId });
          }
        );
      } else if (venue_type === 'show') {
        const { show_category, duration, show_lat, show_long } = req.body;
        db.query(
          'INSERT INTO ParkShow (venue_id, show_lat, show_long, show_category, duration) VALUES (?, ?, ?, ?, ?)',
          [venueId, show_lat || venue_lat, show_long || venue_long, show_category || 'musician', duration || 30],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ venue_id: venueId });
          }
        );
      } else {
        res.status(201).json({ venue_id: venueId });
      }
    }
  );
});

// PUT update venue
router.put('/:id', (req, res) => {
  const { venue_name, hours, venue_lat, venue_long } = req.body;

  db.query(
    'UPDATE Venue SET venue_name = ?, hours = ?, venue_lat = ?, venue_long = ? WHERE venue_id = ?',
    [venue_name, hours, venue_lat, venue_long, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Venue updated' });
    }
  );
});

// DELETE venue
router.delete('/:id', (req, res) => {
  const venueId = req.params.id;

  // Delete from type-specific tables first
  db.query('DELETE FROM Shop WHERE venue_id = ?', [venueId], () => {
    db.query('DELETE FROM Restaurant WHERE venue_id = ?', [venueId], () => {
      db.query('DELETE FROM ParkShow WHERE venue_id = ?', [venueId], () => {
        db.query('DELETE FROM Venue WHERE venue_id = ?', [venueId], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Venue deleted' });
        });
      });
    });
  });
});

export default router;