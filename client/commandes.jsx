import React, { useEffect, useState } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

function CommandesApp() {
  const [commandes, setCommandes] = useState([]);
  const [newCommand, setNewCommand] = useState("");

  const fetchCommandes = async () => {
    const res = await fetch("/api/commandes");
    const data = await res.json();
    setCommandes(data);
  };

  const sendCommand = async () => {
    if (!newCommand.trim()) return;
    await fetch("/api/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: newCommand }),
    });
    setNewCommand("");
    fetchCommandes();
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  return (
    <div>
      <h1>🛰️ Commandes IoT</h1>
      <input
        value={newCommand}
        onChange={(e) => setNewCommand(e.target.value)}
        placeholder="Entrer une commande"
      />
      <button onClick={sendCommand}>Envoyer</button>
      <h3>📋 Commandes existantes</h3>
      <ul>
        {commandes.map((c) => (
          <li key={c.id}>
            <b>{c.command}</b> — {new Date(c.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<CommandesApp />);
