import pool from './config/db.js';

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS commandes (
      id SERIAL PRIMARY KEY,
      command VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("✅ Table 'commandes' prête !");
  await pool.end();
}

initDb();
