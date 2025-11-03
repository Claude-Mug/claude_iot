// server.js (Racine du Projet)

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Importe le module qui définit toutes nos routes
import setupRoutes from './routesProvider.js';

// Nécessaire pour simuler __dirname et __filename en modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Utilise le port fourni par l'environnement (pour l'hébergement) ou 3000 par défaut
const port = process.env.PORT || 3000;

// --- ⚙️ Configuration & Middlewares ---

// Middleware pour servir les fichiers statiques (public et client)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client')));

// Middleware pour parser le corps des requêtes POST entrantes (JSON et URL-encoded)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// --- 🧭 Définition des Routes ---

// Appel du provider qui configure toutes les routes de l'application
setupRoutes(app); 

// --- 🚀 Démarrage du Serveur ---

app.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Serveur IoT Claude-Mug est en écoute !`);
    console.log(`Port: ${port}`);
    console.log(`Statut du Serveur : http://localhost:${port}/status`);
    console.log(`Panneau d'Admin : http://localhost:${port}/home`);
    console.log(`==================================================\n`);
});
