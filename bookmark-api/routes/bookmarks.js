const express = require('express');
const { pool } = require('../db/db');
const { requireAuth } = require('../middleware/auth');
const { validateBookmarkCreate, validateBookmarkUpdate } = require('../utils/validate');

const router = express.Router();
router.use(requireAuth);

async function ownsCollection(collectionId, userId) {
  const result = await pool.query(
    'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId]
  );
  return !!result.rows[0];
}

// GET /api/bookmarks?collection_id=3 — list, optionally filtered by collection
router.get('/', async (req, res, next) => {
  try {
    const { collection_id } = req.query;
    let result;
    if (collection_id) {
      result = await pool.query(
        'SELECT * FROM bookmarks WHERE user_id = $1 AND collection_id = $2 ORDER BY created_at DESC',
        [req.user.id, collection_id]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
    }
    res.status(200).json({ bookmarks: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/bookmarks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookmarks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    const bookmark = result.rows[0];
    if (!bookmark) return res.status(404).json({ error: 'Bookmark not found.' });
    res.status(200).json({ bookmark });
  } catch (err) {
    next(err);
  }
});

// POST /api/bookmarks
router.post('/', async (req, res, next) => {
  try {
    const errors = validateBookmarkCreate(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const { title, url, note = '', collection_id } = req.body;

    if (!(await ownsCollection(collection_id, req.user.id))) {
      return res.status(400).json({ errors: ['collection_id does not refer to one of your collections.'] });
    }

    const result = await pool.query(
      'INSERT INTO bookmarks (user_id, collection_id, title, url, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, collection_id, title, url, note]
    );
    res.status(201).json({ bookmark: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/bookmarks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const existingResult = await pool.query(
      'SELECT * FROM bookmarks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    const existing = existingResult.rows[0];
    if (!existing) return res.status(404).json({ error: 'Bookmark not found.' });

    const errors = validateBookmarkUpdate(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const title = req.body.title !== undefined ? req.body.title : existing.title;
    const url = req.body.url !== undefined ? req.body.url : existing.url;
    const note = req.body.note !== undefined ? req.body.note : existing.note;

    const result = await pool.query(
      `UPDATE bookmarks SET title = $1, url = $2, note = $3, updated_at = now() WHERE id = $4 RETURNING *`,
      [title, url, note, existing.id]
    );
    res.status(200).json({ bookmark: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bookmarks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM bookmarks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Bookmark not found.' });

    await pool.query('DELETE FROM bookmarks WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Bookmark deleted.', id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
