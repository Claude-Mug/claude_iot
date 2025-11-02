import pool from './config/db.js';

async function sendCommand(command) {
  try {
    const result = await pool.query(
      'INSERT INTO commandes (command) VALUES ($1) RETURNING *',
      [command]
    );
    console.log('✅ Commande ajoutée :', result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur lors de l’insertion :', error.message);
  } finally {
    await pool.end();
  }
}

// 🔹 Exemple de test :
sendCommand('led1'); // Tu peux changer ici (ex: led0, claude1, etc.)
