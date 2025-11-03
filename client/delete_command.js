// delete_command.js
import pool from './config/db.js';

/**
 * Supprime une commande de la base de données par son ID.
 * @param {number} commandId - L'ID numérique de la commande à supprimer.
 * @returns {Promise<boolean>} Vrai si une commande a été supprimée, Faux sinon.
 */
async function deleteCommand(commandId) {
    try {
        if (!commandId || isNaN(commandId)) {
            throw new Error("ID de commande invalide ou manquant.");
        }

        const result = await pool.query(
            'DELETE FROM commandes WHERE id = $1',
            [commandId]
        );

        // rowCount > 0 si une ligne a été affectée (supprimée)
        return result.rowCount > 0;

    } catch (err) {
        console.error(`❌ Erreur lors de la suppression de la commande ID ${commandId}:`, err.message);
        throw new Error("Échec de l'opération de suppression en base de données.");
    }
}

export default deleteCommand;
