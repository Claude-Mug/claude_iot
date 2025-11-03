// get_last_command.js

import pool from './config/db.js';

/**
 * Récupère la dernière commande enregistrée dans la base de données.
 * @returns {Promise<{command: string, created_at: Date}|null>} Un objet contenant
 * la commande et la date, ou null si aucune commande n'est trouvée.
 */
async function getLastCommand() {
    try {
        // La requête sélectionne la commande la plus récente basée sur le timestamp
        const result = await pool.query(`
            SELECT command, created_at
            FROM commandes
            ORDER BY created_at DESC
            LIMIT 1;
        `);

        if (result.rows.length > 0) {
            // Renvoie l'objet de la dernière commande trouvée
            return result.rows[0];
        } else {
            // Aucune commande trouvée
            return null;
        }
    } catch (err) {
        console.error("❌ Erreur lors de la récupération de la dernière commande:", err);
        // Lance l'erreur pour que le serveur.js puisse la gérer
        throw new Error("Échec de l'accès à la base de données.");
    }
}

export default getLastCommand;
