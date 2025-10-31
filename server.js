const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let lastCommand = "aucune_commande";

// --- Endpoint pour récupérer la dernière commande ---
app.get("/last_command", (req, res) => {
  res.send(lastCommand);
});

// --- Endpoint pour définir une nouvelle commande ---
app.post("/set_command", (req, res) => {
  if (req.body.command) {
    lastCommand = req.body.command.trim();
    console.log("✅ Nouvelle commande :", lastCommand);
    res.send("Commande mise à jour !");
  } else {
    res.status(400).send("Commande manquante !");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Serveur actif sur le port ${PORT}`));
