// messages.js (Gère l'envoi des messages stockés vers l'APK/Client)

import { getMessageStorageRef } from './esp_send.js';

/**
 * 📤 Récupère tous les messages stockés en RAM pour les envoyer à l'APK.
 * @returns {Array} La liste des messages (copie pour garantir l'immutabilité externe).
 */
function getMessagesForApk() {
    const messages = getMessageStorageRef();
    
    // Renvoie une copie du tableau pour garantir l'immutabilité externe
    return [...messages].reverse(); // Optionnel: Inverser pour que le plus récent soit en premier pour l'affichage
}

export default getMessagesForApk;
