// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

// Middleware pour lire le JSON
app.use(express.json());

// --- Route d'accueil ---
app.get('/', (req, res) => {
  res.send('✅ Serveur Render opérationnel !');
});

// --- Exemple de commande (pour ton ESP32) ---
let lastCommand = "aucune_commande";

// Endpoint pour obtenir la dernière commande
app.get('/last_command', (req, res) => {
  res.send(lastCommand);
});

// Endpoint pour mettre à jour la commande (ex. depuis ton appli web)
app.post('/set_command', (req, res) => {
  const { command } = req.body;
  if (command) {
    lastCommand = command;
    console.log("Nouvelle commande :", command);
    res.json({ success: true, command });
  } else {
    res.status(400).json({ success: false, message: "Aucune commande reçue" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur actif sur le port ${port}`);
});

