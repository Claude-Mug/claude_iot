// ===== server.js =====
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./config/db.js";

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Stockage temporaire des messages ESP ===
let messages = [];
const MAX_MESSAGES = 50;

// === Auth simple (pour accès au tableau web) ===
const USER = "Claude-Mug";
const PASS = "Moscouw03";
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return next(); // laisse passer API

  const b64auth = auth.split(" ")[1];
  const [user, pass] = Buffer.from(b64auth, "base64").toString().split(":");
  if (user === USER && pass === PASS) return next();

  res.set("WWW-Authenticate", 'Basic realm="IoT Dashboard"');
  res.status(401).send("🔒 Authentification requise");
});

// === 🔹 Enregistrer une nouvelle commande ===
app.post("/set_command", async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ success: false, message: "Commande manquante" });

  try {
    // Vérifie si commande déjà présente
    const check = await pool.query("SELECT * FROM commandes WHERE command = $1", [command]);
    if (check.rows.length > 0) {
      // Met à jour la date
      await pool.query("UPDATE commandes SET created_at = NOW() WHERE command = $1", [command]);
      console.log("♻️ Commande mise à jour :", command);
      return res.json({ success: true, updated: true });
    }

    // Limite à 50 commandes max
    const countRes = await pool.query("SELECT COUNT(*) FROM commandes");
    const count = parseInt(countRes.rows[0].count);
    if (count >= 50) {
      await pool.query("DELETE FROM commandes WHERE id IN (SELECT id FROM commandes ORDER BY created_at ASC LIMIT 1)");
    }

    // Ajoute la nouvelle
    await pool.query("INSERT INTO commandes (command) VALUES ($1)", [command]);
    console.log("✅ Nouvelle commande :", command);
    res.json({ success: true, inserted: true });
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// === 🔹 Dernière commande ===
app.get("/last_command", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM commandes ORDER BY created_at DESC LIMIT 1");
    if (rows.length === 0) return res.json({ success: false, message: "Aucune commande" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Erreur /last_command :", err);
    res.status(500).json({ success: false });
  }
});

// === 🔹 Liste des commandes ===
app.get("/commands", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM commandes ORDER BY created_at ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// === 🔹 Supprimer une commande ===
app.delete("/delete_command/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM commandes WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// === 🔹 Messages du microcontrôleur ESP ===
app.post("/esp_message", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "Message manquant" });

  const newMsg = { id: messages.length + 1, message, timestamp: new Date().toISOString() };
  messages.unshift(newMsg);
  if (messages.length > MAX_MESSAGES) messages.pop();

  console.log("📩 Message ESP :", message);
  res.json({ success: true });
});

// === 🔹 Récupérer messages pour l’appli ===
app.get("/messages", (req, res) => res.json(messages));

// === 🔹 Statut serveur ===
app.get("/status", async (req, res) => {
  const { rows } = await pool.query("SELECT COUNT(*) FROM commandes");
  res.json({
    commandes_en_base: rows[0].count,
    messages_en_memoire: messages.length,
    memoire_utilisee: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
    routes_disponibles: ["/commands", "/set_command", "/last_command", "/esp_message", "/messages", "/status"],
  });
});

// === 🔹 UI web protégée ===
app.use("/dashboard", (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    res.set("WWW-Authenticate", 'Basic realm="IoT Dashboard"');
    return res.status(401).send("🔒 Authentification requise");
  }
  const b64auth = auth.split(" ")[1];
  const [user, pass] = Buffer.from(b64auth, "base64").toString().split(":");
  if (user === USER && pass === PASS) {
    res.sendFile(path.join(__dirname, "commandes.html"));
  } else {
    res.status(403).send("Accès refusé");
  }
});

// === Fallback pour 404 ===
app.get("/", (req, res) => res.send("🌐 Serveur IoT en cours d'exécution"));

// === Lancer le serveur ===
app.listen(port, () => console.log(`🚀 Serveur actif sur le port ${port}`));
