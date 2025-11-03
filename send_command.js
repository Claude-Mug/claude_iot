// send_commandes.js

import pool from './config/db.js';

// Nombre maximum de commandes à conserver dans la table
const MAX_COMMANDS = 50;

/**
 * Envoie une commande à la base de données en appliquant la logique d'Upsert et de nettoyage.
 * * Logique :
 * 1. Tente de mettre à jour la commande si elle existe (Upsert).
 * 2. Si la commande a été insérée, vérifie le nombre total de commandes.
 * 3. Si le nombre dépasse MAX_COMMANDS, supprime la commande la plus ancienne.
 * * @param {string} commandText - Le texte de la commande à envoyer/mettre à jour.
 * @returns {Promise<string>} Statut de l'opération (Updated, Inserted, Cleaned).
 */
async function sendCommandToDb(commandText) {
    let client;
    let operationStatus = 'Unknown';

    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Début de la transaction

        // --- 1. Logique d'Upsert : Mise à jour ou Insertion ---
        
        // Tentative de mise à jour si la commande existe déjà
        const updateResult = await client.query(`
            UPDATE commandes
            SET created_at = CURRENT_TIMESTAMP
            WHERE command = $1
            RETURNING id;
        `, [commandText]);

        if (updateResult.rowCount > 0) {
            // La commande existait et a été mise à jour
            operationStatus = 'Updated';
        } else {
            // La commande n'existe pas, on l'insère
            await client.query(`
                INSERT INTO commandes (command)
                VALUES ($1);
            `, [commandText]);
            operationStatus = 'Inserted';
        }

        // --- 2. Logique de Nettoyage : Limiter à 50 commandes ---
        
        // Vérification du nombre de commandes
        const countResult = await client.query('SELECT COUNT(*) AS total_count FROM commandes');
        const totalCount = parseInt(countResult.rows[0].total_count);

        if (totalCount > MAX_COMMANDS) {
            // Si le total est dépassé (ex: 51), on supprime la plus ancienne
            await client.query(`
                DELETE FROM commandes
                WHERE id IN (
                    SELECT id 
                    FROM commandes 
                    ORDER BY created_at ASC 
                    LIMIT 1 
                );
            `);
            operationStatus += ' and Cleaned'; // Ajout du statut de nettoyage
        }

        await client.query('COMMIT'); // Validation de toutes les opérations
        
        return operationStatus;

    } catch (err) {
        if (client) {
            await client.query('ROLLBACK'); // Annulation en cas d'erreur
        }
        console.error("❌ Erreur dans sendCommandToDb (ROLLBACK):", err);
        throw new Error("Échec de l'envoi/mise à jour de la commande et du nettoyage.");
    } finally {
        if (client) {
            client.release();
        }
    }
}

export default sendCommandToDb;
