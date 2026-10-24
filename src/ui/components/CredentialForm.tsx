import { useState } from "react";
import type { Credential } from "../../storage/types";
import * as api from "../api/vault-api";

interface CredentialFormProps {
  editing?: Credential;
  onBack: () => void;
}

export function CredentialForm({ editing, onBack }: CredentialFormProps) {
  const [url, setUrl] = useState(editing?.url ?? "");
  const [username, setUsername] = useState(editing?.username ?? "");
  const [password, setPassword] = useState(editing?.password ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editing) {
        await api.updateCredential(editing.id, url, username, password);
      } else {
        await api.addCredential(url, username, password);
      }
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="header">
        <h1>{editing ? "Edit Credential" : "Add Credential"}</h1>
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Website URL</span>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </label>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Username</span>
          <input
            type="text"
            placeholder="user@example.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Password</span>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Saving..." : editing ? "Save Changes" : "Add Credential"}
        </button>
      </form>
    </div>
  );
}
