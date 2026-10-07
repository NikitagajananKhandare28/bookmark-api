require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { initSchema } = require('./db/db');
const authRoutes = require('./routes/auth');
const collectionRoutes = require('./routes/collections');
const bookmarkRoutes = require('./routes/bookmarks');

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Bookmark Manager API is running. See README for endpoint docs.' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;

initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`Bookmark Manager API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });

module.exports = app;
