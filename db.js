// Import du client PostgreSQL
import pg from "pg";
const { Pool } = pg;

// Création d'une "pool" de connexions à la base PostgreSQL
const pool = new Pool({
  user: "claude_iot_db_user",
  host: "dpg-d42gp2ur433s73dl8hm0-a.oregon-postgres.render.com",
  database: "claude_iot_db",
  password: "7z7ZtHOj71CuPg1GhvZZFOx4FtjjneB2",
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // obligatoire pour Render
  },
});

// Test de la connexion
pool.connect()
  .then(() => {
    console.log("✅ Connecté à la base PostgreSQL Render !");
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à PostgreSQL :", err);
  });

export default pool;
