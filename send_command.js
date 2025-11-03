import pool from './config/db.js';

async function sendCommand(command) {
  try {
    // Vérifier si la commande existe déjà
    const exists = await pool.query(
      'SELECT id FROM commandes WHERE command = $1',
      [command]
    );

    if (exists.rows.length > 0) {
      // Si elle existe déjà → mettre à jour la date
      await pool.query(
        'UPDATE commandes SET created_at = CURRENT_TIMESTAMP WHERE command = $1',
        [command]
      );
      console.log(`♻️ Commande "${command}" mise à jour (existante).`);
    } else {
      // Vérifier combien de commandes existent déjà
      const countResult = await pool.query('SELECT COUNT(*) FROM commandes');
      const count = parseInt(countResult.rows[0].count);

      // Si on a déjà 50 commandes → supprimer la plus ancienne
      if (count >= 50) {
        const deleted = await pool.query(
          'DELETE FROM commandes WHERE id = (SELECT id FROM commandes ORDER BY created_at ASC LIMIT 1) RETURNING *'
        );
        console.log(`🧹 Suppression automatique :`, deleted.rows[0].command);
      }

      // Insérer la nouvelle commande
      const result = await pool.query(
        'INSERT INTO commandes (command) VALUES ($1) RETURNING *',
        [command]
      );
      console.log('✅ Nouvelle commande ajoutée :', result.rows[0]);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi de commande :', error.message);
  } finally {
    await pool.end();
  }
}

// 🔹 Exemple de test :
sendCommand('Lampes_on'); // Tu peux changer ici ex: Lampes0, ultrasonic, etc.
