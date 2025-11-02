import pool from './config/db.js';

async function getLastCommand() {
  try {
    const result = await pool.query(
      'SELECT * FROM commandes ORDER BY created_at DESC LIMIT 1'
    );

    if (result.rows.length > 0) {
      console.log('🟢 Dernière commande :', result.rows[0].command);
    } else {
      console.log('⚪ Aucune commande trouvée.');
    }
  } catch (error) {
    console.error('❌ Erreur de lecture :', error.message);
  } finally {
    await pool.end();
  }
}

getLastCommand();
