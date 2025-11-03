// routesProvider.js
import path from 'path';
import { fileURLToPath } from 'url';

// Modules d'accès aux données
import pool from './config/db.js';             // Connexion DB (pour /status)
import getLastCommand from './get_last_command.js'; // Pour /last_command(s)
import { addEspMessage } from './esp_send.js';    // Pour la route POST /esp_message
import getMessagesForApk from './messages.js';    // Pour la route GET /messages
import getAllCommands from './get_commandes.js'; // Pour la route /all_commands

// Nécessaire pour simuler __dirname et __filename en modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Configure et ajoute toutes les routes Express à l'application.
 * @param {object} app - L'instance de l'application Express.
 */
const setupRoutes = (app) => {
    
    // --- 🛣️ 1. Routes Statiques (GET) ---
    
    // 1. Route racine : /
    // Résultat attendu : page public/index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // 2. Route /home : 
    // Résultat attendu : page client/commandes.html
    app.get('/home', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'commandes.html'));
    });

    // --- 💾 2. Routes Commandes (GET) ---

    // 3. Route /last_command : Texte brut
    app.get('/last_command', async (req, res) => {
        try {
            const lastCommand = await getLastCommand();
            if (lastCommand) {
                res.type('text/plain').send(`Dernière commande : ${lastCommand.command}`);
            } else {
                res.status(404).type('text/plain').send('Aucune commande trouvée.');
            }
        } catch (err) {
            console.error("Erreur sur /last_command:", err.message);
            res.status(500).type('text/plain').send('Erreur serveur.');
        }
    });

    // 4. Route /last_command_json : JSON formaté
    app.get('/last_command_json', async (req, res) => {
        try {
            const lastCommand = await getLastCommand();
            if (lastCommand) {
                res.json({
                    success: true,
                    last_command: {
                        value: lastCommand.command,
                        timestamp: lastCommand.created_at,
                    }
                });
            } else {
                res.status(404).json({ success: false, message: "Aucune commande trouvée." });
            }
        } catch (err) {
            console.error("Erreur sur /last_command_json:", err.message);
            res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    });

    // [NOUVELLE] Route /all_commands : JSON de toutes les commandes
    app.get('/all_commands', async (req, res) => {
        try {
            const allCommands = await getAllCommands();
            res.json({
                success: true,
                count: allCommands.length,
                commands: allCommands
            });
        } catch (err) {
            console.error("Erreur sur /all_commands:", err.message);
            res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    });

    // --- 📱 3. Routes Messages ESP (GET & POST) ---

    // 5. Route /messages : GET (Envoi des messages à l'APK)
    app.get('/messages', (req, res) => {
        try {
            const messages = getMessagesForApk(); // Utilise le gestionnaire RAM
            res.json({
                success: true,
                count: messages.length,
                messages: messages
            });
        } catch (err) {
            console.error("Erreur serveur sur /messages:", err.message);
            res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    });
    
    // 6. Route /esp_message : POST (Réception des messages de l'ESP)
    app.post('/esp_message', (req, res) => {
        const { device_id, message } = req.body;

        if (!device_id || !message) {
            return res.status(400).json({ success: false, message: 'ID du dispositif ou message manquant.' });
        }
        try {
            addEspMessage(device_id, message);
            res.json({ success: true, message: 'Message reçu et stocké en RAM.' });
        } catch (error) {
            console.error("Erreur lors de l'ajout du message:", error);
            res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
        }
    });

    // --- ⚙️ 4. Route Status ---

    // 7. Route /status : Infos système et routes disponibles
    app.get('/status', (req, res) => {
        const routes = [
            '/', '/home', '/last_command', '/last_command_json', '/all_commands', 
            '/messages', '/esp_message (POST)', '/status'
        ];
        
        const dbStatus = pool ? 'Pool Initialisé' : 'Non Initialisé';

        res.json({
            service: 'Claude-IoT API Server',
            status: 'online',
            environment: process.env.NODE_ENV || 'development',
            db_status: dbStatus,
            routes_available: routes,
            timestamp: new Date().toISOString()
        });
    });
};

export default setupRoutes;
