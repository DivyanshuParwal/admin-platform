require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');

let dbReady;

function ensureDb() {
  if (!process.env.MONGODB_URI) {
    return Promise.reject(new Error('MONGODB_URI is not set'));
  }
  if (!dbReady) {
    dbReady = connectDB().catch((err) => {
      dbReady = null;
      console.error('MongoDB connection failed:', err.message);
      throw err;
    });
  }
  return dbReady;
}

module.exports = async (req, res) => {
  const path = req.url || '';
  const isHealth = path === '/api/health' || path.startsWith('/api/health?');
  const isRoot = path === '/' || path === '';

  if (!isHealth && !isRoot) {
    await ensureDb();
  }

  return app(req, res);
};
