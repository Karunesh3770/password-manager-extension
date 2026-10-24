import { useState } from "react";
import type { Credential } from "../../storage/types";
import * as api from "../api/vault-api";

interface CredentialRowProps {
  credential: Credential;
  onEdit: () => void;
  onDelete: () => void;
}

export function CredentialRow({ credential, onEdit, onDelete }: CredentialRowProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [masterPw, setMasterPw] = useState("");
  const [verifyError, setVerifyError] = useState("");

  async function handleShowClick() {
    if (showPassword) {
      setShowPassword(false);
      return;
    }
    const settings = await api.getSettings();
    if (settings.authMode === "every_fill") {
      setVerifying(true);
      setMasterPw("");
      setVerifyError("");
    } else {
      setShowPassword(true);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!masterPw) return;
    setVerifyError("");
    try {
      await api.verifyForFill(masterPw);
      setShowPassword(true);
      setVerifying(false);
      setMasterPw("");
    } catch {
      setVerifyError("Wrong password");
      setMasterPw("");
    }
  }

  return (
    <div role="listitem" style={{ padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {credential.url}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {credential.username}
          </div>
          <div style={{ fontSize: 12, fontFamily: "monospace", marginTop: 2 }}>
            {showPassword ? credential.password : "••••••••"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginLeft: 8, flexShrink: 0 }}>
          <button
            className="btn-secondary"
            onClick={handleShowClick}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
          <button
            className="btn-secondary"
            onClick={onEdit}
            aria-label="Edit credential"
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            Edit
          </button>
          <button
            className="btn-danger"
            onClick={onDelete}
            aria-label="Delete credential"
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            Del
          </button>
        </div>
      </div>

      {verifying && (
        <form onSubmit={handleVerify} style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
          <input
            type="password"
            placeholder="Master password"
            value={masterPw}
            onChange={(e) => setMasterPw(e.target.value)}
            autoFocus
            style={{ flex: 1, padding: "4px 8px", fontSize: 12 }}
          />
          <button type="submit" className="btn-primary" style={{ padding: "4px 10px", fontSize: 12 }}>
            Verify
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setVerifying(false); setMasterPw(""); setVerifyError(""); }}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            Cancel
          </button>
        </form>
      )}
      {verifying && verifyError && (
        <p style={{ color: "var(--color-danger)", fontSize: 11, margin: "4px 0 0" }}>{verifyError}</p>
      )}
    </div>
  );
}
