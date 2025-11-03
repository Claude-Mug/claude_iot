// ===== server.js =====
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import pool from "./config/db.js";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// === Variables mémoire ===
let messages = [];
const MAX_MESSAGES = 30; // nombre max de messages temporaires

// === 🔹 Insérer ou mettre à jour une commande ===
app.post("/set_command", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ success: false, message: "Aucune commande reçue" });
  }

  try {
    // Vérifier si la commande existe déjà
    const check = await pool.query("SELECT * FROM commandes WHERE command = $1", [command]);

    if (check.rows.length > 0) {
      // 🔄 Mise à jour de la commande existante
      await pool.query(
        "UPDATE commandes SET updated_at = NOW() WHERE command = $1",
        [command]
      );
      console.log("🔁 Commande mise à jour :", command);
    } else {
      // ➕ Insertion d'une nouvelle commande
      await pool.query("INSERT INTO commandes (command) VALUES ($1)", [command]);
      console.log("✅ Nouvelle commande enregistrée :", command);
    }

    // 🔹 Nettoyage pour garder les 50 dernières commandes
    await pool.query(`
      DELETE FROM commandes
      WHERE id NOT IN (
        SELECT id FROM commandes ORDER BY created_at DESC LIMIT 50
      );
    `);

    res.json({ success: true, command });
  } catch (err) {
    console.error("❌ Erreur lors de l’enregistrement :", err.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// === 📡 Réception des messages venant du microcontrôleur ESP32 ===
app.post("/esp_message", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: "Message manquant" });
  }

  const newMsg = {
    id: Date.now(),
    message,
    timestamp: new Date().toISOString(),
  };

  // On stocke en mémoire
  messages.unshift(newMsg);
  if (messages.length > MAX_MESSAGES) messages.pop(); // suppression des plus anciens

  console.log("📥 Message reçu de l'ESP :", message);
  res.json({ success: true, message: "Message reçu et stocké temporairement", data: newMsg });
});

// === 📱 Récupération des messages pour l’application mobile ===
app.get("/messages", (req, res) => {
  res.json(messages);
});

// === 🩺 Route de diagnostic du serveur ===
app.get("/status", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM commandes");
    res.json({
      commandes_en_base: rows[0].count,
      messages_en_memoire: messages.length,
      memoire_utilisee: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du diagnostic" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Middleware pour servir les fichiers statiques ===
app.use(express.static(__dirname));

// === Route principale (affiche ton interface web) ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "commandes.html"));
});


// === 🚀 Lancement du serveur ===
app.listen(port, async () => {
  console.log(`✅ Serveur actif sur http://localhost:${port}`);
});
