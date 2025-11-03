// get_commandes.js

import pool from './config/db.js';

/**
 * Récupère toutes les commandes enregistrées dans la base de données, 
 * triées par date de création descendante.
 * @returns {Promise<Array<{id: number, command: string, created_at: Date}>>} 
 * Une promesse résolue avec un tableau des objets commande.
 */
async function getAllCommands() { // Renommée de getCommandes à getAllCommands
    try {
        // Sélectionne toutes les colonnes de toutes les lignes, triées par la plus récente en premier
        const result = await pool.query(`
            SELECT id, command, created_at
            FROM commandes
            ORDER BY created_at DESC;
        `);

        // Renvoie le tableau de toutes les commandes
        return result.rows;
        
    } catch (err) {
        console.error("❌ Erreur lors de la récupération de toutes les commandes:", err);
        // Lance l'erreur pour que le serveur.js puisse la gérer
        throw new Error("Échec de l'accès à la base de données pour récupérer les commandes.");
    }
}

export default getAllCommands;
