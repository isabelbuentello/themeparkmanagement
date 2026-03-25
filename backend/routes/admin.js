import express from 'express'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

// MIDDLEWARE

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

// POST CONFIGURATION ROUTES (Create items)

// GM can create a new Ticket Type (Now includes price)
router.post(
    '/ticket-type',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        const { ticket_name, ticket_description, price } = req.body;

        if (!ticket_name || price === undefined) {
            return res.status(400).json({ message: 'Ticket name and price are required' });
        }

        db.query(
            `INSERT INTO TicketType (ticket_name, ticket_description, price) VALUES (?, ?, ?)`,
            [ticket_name, ticket_description || null, price],
            (err) => {
                if (err) return res.status(500).json({ message: 'Error adding ticket type', error: err.message });
                res.json({ message: 'Ticket type added successfully' });
            }
        );
    }
);

// GM can create a new Pass Type (Now includes price)
router.post(
    '/pass-type',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        const { pass_name, pass_description, price } = req.body;

        if (!pass_name || price === undefined) {
            return res.status(400).json({ message: 'Pass name and price are required' });
        }

        db.query(
            `INSERT INTO PassType (pass_name, pass_description, price) VALUES (?, ?, ?)`,
            [pass_name, pass_description || null, price],
            (err) => {
                if (err) return res.status(500).json({ message: 'Error adding pass type', error: err.message });
                res.json({ message: 'Pass type added successfully' });
            }
        );
    }
);

// GM can create a Membership Tier (Now includes price)
router.post(
    '/membership-tier',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        const { tier_name, discount, price } = req.body;

        if (!tier_name || discount === undefined || price === undefined) {
            return res.status(400).json({ message: 'Tier name, discount, and price are required' });
        }

        db.query(
            `INSERT INTO MembershipTier (tier_name, discount, price) VALUES (?, ?, ?)`,
            [tier_name, discount, price],
            (err) => {
                if (err) return res.status(500).json({ message: 'Error adding membership tier', error: err.message });
                res.json({ message: 'Membership tier added successfully' });
            }
        );
    }
);

// GM can create a specific Perk
router.post(
    '/perk',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        const { perk_name, perk_description } = req.body;

        if (!perk_name) {
            return res.status(400).json({ message: 'Perk name is required' });
        }

        db.query(
            `INSERT INTO Perk (perk_name, perk_description) VALUES (?, ?)`,
            [perk_name, perk_description || null],
            (err) => {
                if (err) return res.status(500).json({ message: 'Error adding perk', error: err.message });
                res.json({ message: 'Perk added successfully' });
            }
        );
    }
);

// GM can link a Perk to a Membership Tier
router.post(
    '/tier-perk',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        const { tier_id, perk_id } = req.body;

        if (!tier_id || !perk_id) {
            return res.status(400).json({ message: 'Both Tier ID and Perk ID are required' });
        }

        db.query(
            `INSERT INTO TierPerk (tier_id, perk_id) VALUES (?, ?)`,
            [tier_id, perk_id],
            (err) => {
                if (err) {
                    // Check for duplicate entry error (Code 1062 in MySQL)
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: 'This perk is already assigned to this tier' });
                    }
                    return res.status(500).json({ message: 'Error linking perk to tier', error: err.message });
                }
                res.json({ message: 'Perk successfully linked to tier' });
            }
        );
    }
);

// GET CONFIGURATION ROUTES (For dropdowns)

// GET all Membership Tiers for dropdowns
router.get(
    '/membership-tiers',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        db.query('SELECT tier_id, tier_name FROM MembershipTier ORDER BY tier_id', (err, results) => {
            if (err) return res.status(500).json({ message: 'Server error', error: err.message });
            res.json(results);
        });
    }
);

// GET all Perks for dropdowns
router.get(
    '/perks',
    verifyToken,
    requireRole('general_manager'),
    (req, res) => {
        db.query('SELECT perk_id, perk_name FROM Perk ORDER BY perk_id', (err, results) => {
            if (err) return res.status(500).json({ message: 'Server error', error: err.message });
            res.json(results);
        });
    }
);

export default router