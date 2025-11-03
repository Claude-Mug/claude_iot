import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Commandes() {
  const [command, setCommand] = useState("");
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "https://claude-iot.onrender.com";

  // Charger toutes les commandes existantes
  const fetchCommandes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/all_commands`);
      setCommandes(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement :", error);
    }
  };

  // Envoyer une nouvelle commande
  const sendCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return alert("Veuillez saisir une commande !");
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/set_command`, { command });
      setCommand("");
      fetchCommandes(); // recharge la liste après insertion
    } catch (error) {
      console.error("Erreur lors de l’envoi :", error);
      alert("Échec de l’envoi de la commande");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌐 Interface IoT — Gestion des Commandes</h1>

      <form onSubmit={sendCommand} style={styles.form}>
        <input
          type="text"
          placeholder="Ex : allumer_led"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      <h2 style={styles.subtitle}>📋 Liste des commandes enregistrées</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Commande</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {commandes.length > 0 ? (
            commandes.map((cmd) => (
              <tr key={cmd.id}>
                <td>{cmd.id}</td>
                <td>{cmd.command}</td>
                <td>{new Date(cmd.created_at).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center" }}>
                Aucune commande enregistrée
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --- Styles en JS ---
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "50px auto",
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    color: "#007bff",
  },
  subtitle: {
    marginTop: "30px",
    color: "#333",
  },
  form: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  button: {
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#007bff",
    color: "white",
    padding: "10px",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px",
  },
};
