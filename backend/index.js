require('dotenv').config();

const express = require('express');
const cors = require('cors');
const speakerRoutes = require('./routes/speakers');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sessionboard-backend' });
});

app.use('/api/speakers', speakerRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sessionboard backend listening on port ${PORT}`);
  });
}

module.exports = app;
