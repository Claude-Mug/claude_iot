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

// 🌐 Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "client")));

// 🗄️ Connexion à PostgreSQL
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/iotdb",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// 💬 Mémoire temporaire des messages ESP
let messages = [];
const MAX_MESSAGES = 50;

// 🏠 Page principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🖥️ Page commandes.html
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "commandes.html"));
});

// ⚙️ Dernière commande (texte brut, pour ESP)
app.get("/last_command", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM commandes ORDER BY id DESC LIMIT 1"
    );
    if (rows.length === 0)
      return res
        .status(200)
        .type("text/plain")
        .send("Aucune commande disponible.");
    const cmd = rows[0];
    res.type("text/plain").send(cmd.command);
  } catch (error) {
    console.error("❌ Erreur /last_command :", error.message);
    res.status(500).type("text/plain").send("Erreur serveur : " + error.message);
  }
});

// ⚙️ Dernière commande (JSON)
app.get("/last_command_json", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM commandes ORDER BY id DESC LIMIT 1"
    );
    if (rows.length === 0)
      return res.json({ success: false, message: "Aucune commande trouvée" });
    res.json({ success: true, last_command: rows[0] });
  } catch (error) {
    console.error("❌ Erreur /last_command_json :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 Ajouter une commande depuis l’UI
app.post("/set_command", async (req, res) => {
  const { command } = req.body;
  if (!command)
    return res.status(400).json({ success: false, message: "Commande manquante" });
  try {
    await pool.query("INSERT INTO commandes (command) VALUES ($1)", [command]);
    console.log(`✅ Nouvelle commande enregistrée : ${command}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur /set_command :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📩 Réception des messages ESP
app.post("/esp_message", express.text({ type: "*/*" }), (req, res) => {
  const rawBody = req.body;
  let message;
  try {
    const parsed = JSON.parse(rawBody);
    message = parsed.message || JSON.stringify(parsed);
  } catch {
    message = rawBody.trim();
  }

  if (!message)
    return res.status(400).json({ success: false, message: "Message vide" });

  const newMsg = {
    id: messages.length + 1,
    message,
    timestamp: new Date().toISOString(),
  };
  messages.unshift(newMsg);
  if (messages.length > MAX_MESSAGES) messages.pop();

  console.log("📡 Message ESP :", message);
  res.json({ success: true });
});

// 💾 Récupérer les messages
app.get("/messages", (req, res) => res.json(messages));

// 📊 Statut du serveur
app.get("/status", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM commandes");
    res.json({
      success: true,
      commandes_en_base: rows[0].count,
      messages_en_memoire: messages.length,
      memoire_utilisee:
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
      routes_disponibles: [
        "/home",
        "/last_command",
        "/last_command_json",
        "/set_command",
        "/esp_message",
        "/messages",
        "/status",
      ],
    });
  } catch (error) {
    console.error("❌ Erreur /status :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚫 Fallback
app.use((req, res) => res.status(404).send("❌ Route introuvable"));

// 🏁 Lancer le serveur
app.listen(port, () =>
  console.log(`🚀 Serveur IoT actif sur le port ${port}`)
);
