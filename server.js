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

// Sert les fichiers statiques (public et client)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "client")));

// === 🔹 Connexion PostgreSQL ===
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/iotdb",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// === 🔹 Mémoire tampon pour les messages ESP ===
let messages = [];
const MAX_MESSAGES = 50;

// === 🔹 ROUTES ===

// Page d’accueil (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Page des commandes (commandes.html)
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "commandes.html"));
});

// === 🔹 Enregistrer une commande ===
app.post("/set_command", async (req, res) => {
  const { command } = req.body;
  if (!command)
    return res.status(400).json({ success: false, message: "Champ 'command' manquant" });

  try {
    // Vérifier si la commande existe déjà
    const exists = await pool.query('SELECT id FROM commandes WHERE command = $1', [command]);

    if (exists.rows.length > 0) {
      // Si existe → mettre à jour la date
      await pool.query('UPDATE commandes SET created_at = CURRENT_TIMESTAMP WHERE command = $1', [command]);
      console.log(`♻️ Commande "${command}" mise à jour.`);
    } else {
      // Supprimer la plus ancienne si +50 commandes
      const countResult = await pool.query('SELECT COUNT(*) FROM commandes');
      const count = parseInt(countResult.rows[0].count);

      if (count >= 50) {
        await pool.query(
          'DELETE FROM commandes WHERE id = (SELECT id FROM commandes ORDER BY created_at ASC LIMIT 1)'
        );
        console.log(`🧹 Suppression automatique dʼune commande ancienne`);
      }
      // Insérer la nouvelle commande
      await pool.query(
        'INSERT INTO commandes (command) VALUES ($1)',
        [command]
      );
      console.log('✅ Nouvelle commande ajoutée :', command);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur /set_command :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === 🔹 Liste des commandes ===
app.get("/commands", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM commandes ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error("Erreur /commands :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === 🔹 Dernière commande — format texte brut (pour ESP) ===
app.get("/last_command", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT command FROM commandes ORDER BY created_at DESC LIMIT 1"
    );
    if (rows.length === 0)
      return res
        .status(200)
        .type("text/plain")
        .send("Aucune commande disponible pour le moment.");
    res.type("text/plain").send(rows[0].command);
  } catch (error) {
    console.error("Erreur /last_command :", error.message);
    res.status(500).type("text/plain").send("Erreur serveur : " + error.message);
  }
});

// === 🔹 Dernière commande — format JSON ===
app.get("/last_command_json", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM commandes ORDER BY created_at DESC LIMIT 1"
    );
    if (rows.length === 0)
      return res.json({ success: false, message: "Aucune commande trouvée" });
    res.json({ success: true, last_command: rows[0] });
  } catch (error) {
    console.error("Erreur /last_command_json :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === 🔹 Réception des messages ESP (texte ou JSON) ===
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

  console.log("📩 Message ESP reçu :", message);
  res.json({ success: true });
});

// === 🔹 Liste des messages en mémoire ===
app.get("/messages", (req, res) => res.json(messages));

// === 🔹 Statut du serveur ===
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
        "/set_command",
        "/commands",
        "/last_command",
        "/last_command_json",
        "/esp_message",
        "/messages",
        "/status",
      ],
    });
  } catch (error) {
    console.error("Erreur /status :", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === 🔹 Fallback 404 ===
app.use((req, res) => res.status(404).send("❌ Route introuvable"));

// === 🔹 Lancement du serveur ===
app.listen(port, () => console.log(`🚀 Serveur IoT actif sur le port ${port}`));
