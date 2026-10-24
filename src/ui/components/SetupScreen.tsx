import { useState } from "react";
import * as api from "../api/vault-api";

interface SetupScreenProps {
  onDone: () => void;
}

export function SetupScreen({ onDone }: SetupScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.setup(password, email || undefined);
      if (result.recoveryKey) {
        setRecoveryKey(result.recoveryKey);
      } else {
        onDone();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleEmailRecoveryKey() {
    const subject = encodeURIComponent("Password Manager - Recovery Key");
    const body = encodeURIComponent(
      `Your recovery key for the Password Manager extension:\n\n${recoveryKey}\n\nKeep this safe. You will need it to reset your master password.`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url: gmailUrl });
    } else {
      window.open(gmailUrl, "_blank");
    }
  }

  function handleCopyRecoveryKey() {
    navigator.clipboard.writeText(recoveryKey);
  }

  if (recoveryKey) {
    return (
      <div>
        <div className="header">
          <h1>Save Recovery Key</h1>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            Save this recovery key. If you forget your master password, you can use it to reset it.
          </p>

          <div style={{
            background: "var(--color-bg-secondary, #f8f9fa)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "16px",
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1,
            wordBreak: "break-all",
          }}>
            {recoveryKey}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={handleCopyRecoveryKey}
              style={{ flex: 1 }}
            >
              Copy
            </button>
            <button
              className="btn-secondary"
              onClick={handleEmailRecoveryKey}
              style={{ flex: 1 }}
            >
              Email to myself
            </button>
          </div>

          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>
            Recovery email: {email}
          </p>

          <button className="btn-primary" onClick={onDone} style={{ marginTop: 4 }}>
            I've saved it — Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Create Master Password</h1>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          This password encrypts your vault with AES-256. A recovery key will be generated for password reset.
        </p>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Recovery Email</span>
          <input
            type="email"
            placeholder="your@email.com (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Master Password</span>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label>
          <span style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Confirm Password</span>
          <input
            type="password"
            placeholder="Repeat your master password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>
        {error && <p style={{ color: "var(--color-danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? "Setting up..." : "Create Vault"}
        </button>
      </form>
    </div>
  );
}
