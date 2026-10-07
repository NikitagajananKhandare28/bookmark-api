const express = require('express');
const { pool } = require('../db/db');
const { requireAuth } = require('../middleware/auth');
const { validateCollectionCreate, validateCollectionUpdate } = require('../utils/validate');

const router = express.Router();
router.use(requireAuth);

// GET /api/collections — list, with a bookmark count per collection
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(b.id)::int AS bookmark_count
       FROM collections c
       LEFT JOIN bookmarks b ON b.collection_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ collections: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/collections/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    const collection = result.rows[0];
    if (!collection) return res.status(404).json({ error: 'Collection not found.' });
    res.status(200).json({ collection });
  } catch (err) {
    next(err);
  }
});

// POST /api/collections
router.post('/', async (req, res, next) => {
  try {
    const errors = validateCollectionCreate(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const result = await pool.query(
      'INSERT INTO collections (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.id, req.body.name]
    );
    res.status(201).json({ collection: { ...result.rows[0], bookmark_count: 0 } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/collections/:id
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Collection not found.' });

    const errors = validateCollectionUpdate(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const name = req.body.name !== undefined ? req.body.name : existing.rows[0].name;
    const result = await pool.query(
      'UPDATE collections SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id]
    );
    res.status(200).json({ collection: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/collections/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Collection not found.' });

    await pool.query('DELETE FROM collections WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Collection deleted.', id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
