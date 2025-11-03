// esp_send.js (Gère la réception des messages de l'ESP et le stockage en RAM)

// Tableau pour stocker les messages en RAM
const messages = [];

// Durée de vie maximale des messages en millisecondes (15 minutes)
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;


/**
 * 🧹 Fonction pour nettoyer les messages plus anciens que 15 minutes.
 */
function cleanupMessages() {
    const now = Date.now();
    const expiryTime = now - CLEANUP_INTERVAL_MS;

    let indexToRemove = -1;
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].created_at.getTime() < expiryTime) {
            indexToRemove = i + 1;
        } else {
            break;
        }
    }

    if (indexToRemove > 0) {
        messages.splice(0, indexToRemove);
        console.log(`[Cleaner] ${indexToRemove} anciens messages ESP supprimés. Reste: ${messages.length}`);
    }
}

// ⏱️ Configure l'intervalle de nettoyage automatique
setInterval(cleanupMessages, CLEANUP_INTERVAL_MS);
console.log(`[ESP Manager] Nettoyage configuré toutes les ${CLEANUP_INTERVAL_MS / 60000} minutes.`);


/**
 * 📥 Ajoute un nouveau message au tableau.
 * Cette fonction est appelée par la route POST de votre server.js.
 * @param {string} device_id - L'identifiant du dispositif.
 * @param {string} message - Le contenu du message/état.
 */
function addEspMessage(device_id, message) {
    const newMessage = {
        device_id: device_id,
        message: message,
        created_at: new Date()
    };
    
    messages.push(newMessage);
}


/**
 * 📤 Récupère la référence au tableau de messages.
 * Cette fonction est utilisée par messages.js pour accéder aux données.
 * @returns {Array} La référence du tableau de messages.
 */
function getMessageStorageRef() {
    return messages;
}

export { addEspMessage, getMessageStorageRef };
