import { useState, useEffect, useCallback } from "react";
import type { Credential } from "../../storage/types";
import * as api from "../api/vault-api";
import { CredentialRow } from "./CredentialRow";

interface VaultScreenProps {
  onAdd: () => void;
  onEdit: (c: Credential) => void;
  onLock: () => void;
  onSettings: () => void;
}

function handlePopOut() {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    const popupUrl = chrome.runtime.getURL("popup.html");
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url: popupUrl }, () => window.close());
    } else {
      window.open(popupUrl, "_blank");
      window.close();
    }
  }
}

export function VaultScreen({ onAdd, onEdit, onLock, onSettings }: VaultScreenProps) {
  const [query, setQuery] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCredentials = useCallback(async () => {
    try {
      const creds = query
        ? await api.searchCredentials(query)
        : await api.getAll();
      setCredentials(creds);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  async function handleDelete(id: string) {
    await api.deleteCredential(id);
    loadCredentials();
  }

  return (
    <div>
      <div className="header">
        <h1>Vault</h1>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn-secondary"
            onClick={handlePopOut}
            style={{ padding: "6px 8px", fontSize: 12 }}
            title="Open in tab"
          >
            &#x2197;
          </button>
          <button
            className="btn-secondary"
            onClick={onSettings}
            style={{ padding: "6px 8px", fontSize: 12 }}
            title="Settings"
          >
            &#x2699;
          </button>
          <button className="btn-secondary" onClick={onLock} style={{ padding: "6px 10px", fontSize: 12 }}>
            Lock
          </button>
          <button className="btn-primary" onClick={onAdd}>
            + Add
          </button>
        </div>
      </div>

      <div style={{ padding: "10px 16px" }}>
        <input
          type="search"
          placeholder="Search credentials..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search credentials"
        />
      </div>

      <div role="list" style={{ padding: "0 16px 16px" }}>
        {loading && (
          <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "24px 0" }}>
            Decrypting vault...
          </p>
        )}
        {!loading && credentials.length === 0 && (
          <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "24px 0" }}>
            No credentials found.
          </p>
        )}
        {credentials.map((c) => (
          <CredentialRow
            key={c.id}
            credential={c}
            onEdit={() => onEdit(c)}
            onDelete={() => handleDelete(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
