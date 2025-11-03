// ===== server.js =====
import express from "express";
import pkg from "pg";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 10000;

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Configuration PostgreSQL (Render) ===
const pool = new Pool({
  user: "claude_iot_db_user",
  host: "dpg-d42gp2ur433s73dl8hm0-a.oregon-postgres.render.com",
  database: "claude_iot_db",
  password: "7z7ZtHOj71CuPg1GhvZZFOx4FtjjneB2",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// === Initialisation de la base ===
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commandes (
        id SERIAL PRIMARY KEY,
        command VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'commandes' prête !");
  } catch (err) {
    console.error("❌ Erreur lors de l'initialisation de la table :", err);
  }
}

// === Configuration des chemins pour le client (interface web React) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "client")));

// === Route d’accueil (affiche la page principale) ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "commandes.jsx"));
});

// === Vérification de la table ===
app.get("/check_table", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'commandes';
    `);

    if (result.rows.length > 0) {
      res.send("✅ La table 'commandes' existe dans la base !");
    } else {
      res.send("❌ La table 'commandes' n'existe pas !");
    }
  } catch (error) {
    console.error("Erreur de vérification :", error);
    res.status(500).send("Erreur lors de la vérification de la table");
  }
});

// === Récupérer toutes les commandes ===
app.get("/commands", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM commandes ORDER BY id DESC;"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur lors de la récupération :", err);
    res.status(500).send("Erreur serveur");
  }
});

// === Récupérer la dernière commande ===
app.get("/last_command", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT command FROM commandes ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length > 0) {
      res.send(result.rows[0].command);
    } else {
      res.send("aucune_commande");
    }
  } catch (err) {
    console.error("Erreur lors de la récupération :", err);
    res.status(500).send("Erreur serveur");
  }
});

// === Insérer une nouvelle commande ===
app.post("/set_command", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res
      .status(400)
      .json({ success: false, message: "Aucune commande reçue" });
  }

  try {
    await pool.query("INSERT INTO commandes (command) VALUES ($1)", [command]);
    console.log("📩 Nouvelle commande enregistrée :", command);
    res.json({ success: true, command });
  } catch (err) {
    console.error("Erreur lors de l’insertion :", err);
    res
      .status(500)
      .json({ success: false, message: "Erreur lors de l’insertion" });
  }
});

// === Route fallback pour React Router / SPA ===
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "commandes.html"));
});

// === Lancement du serveur ===
app.listen(port, async () => {
  await initDb();
  console.log(`🚀 Serveur actif sur le port ${port}`);
});
