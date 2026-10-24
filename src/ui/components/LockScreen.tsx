import { useState } from "react";
import * as api from "../api/vault-api";

interface LockScreenProps {
  onUnlocked: () => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.unlock(password);
      onUnlocked();
    } catch {
      setError("Wrong master password.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="header">
        <h1>Unlock Vault</h1>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Master Password</span>
          <input
            type="password"
            placeholder="Enter master password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </label>
        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Unlocking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
