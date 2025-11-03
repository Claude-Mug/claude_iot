// ===== server.js =====
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// === 🔹 Middlewares ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // pour servir commandes.html, css, etc.

// === 🔹 Connexion PostgreSQL ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/iotdb",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// === 🔹 Mémoire tampon pour messages ESP ===
let messages = [];
const MAX_MESSAGES = 50;

// === 🔹 Récupérer toutes les commandes ===
app.get("/commands", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM commandes ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Erreur /commands :", error);
    res.status(500).json({ success: false });
  }
});

// === 🔹 Ajouter une nouvelle commande ===
app.post("/set_command", async (req, res) => {
  const { device, action } = req.body;
  if (!device || !action) return res.status(400).json({ success: false, message: "Champs manquants" });

  try {
    await pool.query("INSERT INTO commandes (device, action, date_creation) VALUES ($1, $2, NOW())", [device, action]);
    console.log(`✅ Commande enregistrée : ${device} -> ${action}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur /set_command :", error);
    res.status(500).json({ success: false });
  }
});

// === 🔹 Dernière commande ===
app.get("/last_command", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM commandes ORDER BY id DESC LIMIT 1");
    if (rows.length === 0) return res.json({ success: false, message: "Aucune commande trouvée" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur /last_command :", error);
    res.status(500).json({ success: false });
  }
});

// === 🔹 Messages venant du microcontrôleur ESP ===
app.post("/esp_message", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "Message manquant" });

  const newMsg = { id: messages.length + 1, message, timestamp: new Date().toISOString() };
  messages.unshift(newMsg);
  if (messages.length > MAX_MESSAGES) messages.pop();

  console.log("📩 Message ESP :", message);
  res.json({ success: true });
});

// === 🔹 Récupérer les messages pour l’interface web ===
app.get("/messages", (req, res) => res.json(messages));

// === 🔹 Statut serveur ===
app.get("/status", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM commandes");
    res.json({
      commandes_en_base: rows[0].count,
      messages_en_memoire: messages.length,
      memoire_utilisee: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
      routes_disponibles: ["/commands", "/set_command", "/last_command", "/esp_message", "/messages", "/status"],
    });
  } catch (error) {
    console.error("Erreur /status :", error);
    res.status(500).json({ success: false });
  }
});

// === 🔹 Page principale (home) ===
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "commandes.html"));
});

// === 🔹 Route racine ===
app.get("/", (req, res) => res.send("🌐 Serveur IoT en cours d'exécution"));

// === 🔹 Fallback 404 ===
app.use((req, res) => res.status(404).send("❌ Route introuvable"));

// === 🔹 Lancement du serveur ===
app.listen(port, () => console.log(`🚀 Serveur actif sur le port ${port}`));
