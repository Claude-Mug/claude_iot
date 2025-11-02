// server.js
import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Configuration PostgreSQL (Render) ---
const pool = new Pool({
  user: 'claude_iot_db_user',
  host: 'dpg-d42gp2ur433s73dl8hm0-a.oregon-postgres.render.com',
  database: 'claude_iot_db',
  password: '7z7ZtHOj71CuPg1GhvZZFOx4FtjjneB2',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// --- Initialisation de la table ---
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS commandes (
      id SERIAL PRIMARY KEY,
      command VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("✅ Table 'commandes' prête !");
}

// --- Routes API ---
app.get('/api/commandes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM commandes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

app.post('/api/commandes', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ message: "Commande manquante" });
  try {
    await pool.query('INSERT INTO commandes (command) VALUES ($1)', [command]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// --- Route principale (interface web) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, async () => {
  await initDb();
  console.log(`🚀 Serveur actif sur le port ${port}`);
});
