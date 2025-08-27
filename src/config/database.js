const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fleet_management',
  password: process.env.DB_PASSWORD || 'truk1234',
  port: process.env.DB_PORT || 5432,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait when connecting a client
});

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('📊 Database time:', result.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('💥 Unexpected database pool error:', err);
});

module.exports = pool;