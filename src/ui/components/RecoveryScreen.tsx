import { useState } from "react";
import * as api from "../api/vault-api";

interface RecoveryScreenProps {
  onRecovered: () => void;
  onBack: () => void;
}

export function RecoveryScreen({ onRecovered, onBack }: RecoveryScreenProps) {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recoveryKey.trim()) {
      setError("Enter your recovery key.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.recoverPassword(recoveryKey.trim(), newPassword);
      onRecovered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid recovery key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="header">
        <h1>Reset Password</h1>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          Enter the recovery key you saved during setup to reset your master password.
        </p>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Recovery Key</span>
          <input
            type="text"
            placeholder="XXXXX-XXXXX-XXXXX"
            value={recoveryKey}
            onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
            required
            autoFocus
            style={{ fontFamily: "monospace", letterSpacing: 1 }}
          />
        </label>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>New Master Password</span>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Confirm New Password</span>
          <input
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
