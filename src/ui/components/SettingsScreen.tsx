import { useState, useEffect } from "react";
import type { AuthMode } from "../../storage/types";
import * as api from "../api/vault-api";

interface SettingsScreenProps {
  onBack: () => void;
}

const OPTIONS: { mode: AuthMode; title: string; description: string }[] = [
  {
    mode: "none",
    title: "No password required",
    description: "Autofill works instantly without any password prompt.",
  },
  {
    mode: "login_only",
    title: "Only when opening vault",
    description: "Autofill works without re-entering the master password once unlocked.",
  },
  {
    mode: "every_fill",
    title: "Before every autofill",
    description: "Asks for the master password each time before filling credentials.",
  },
];

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("every_fill");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setAuthMode(s.authMode);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleChange(mode: AuthMode) {
    setAuthMode(mode);
    setSaved(false);
    await api.setSettings({ authMode: mode });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="header">
        <h1>Settings</h1>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
        ) : (
          <fieldset style={{ border: "none", padding: 0 }}>
            <legend style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              When to require master password
            </legend>

            {OPTIONS.map(({ mode, title, description }) => (
              <label key={mode} style={{
                display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
                border: `1px solid ${authMode === mode ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: "var(--radius)", marginBottom: 8, cursor: "pointer",
                background: authMode === mode ? "rgba(66,99,235,0.05)" : "transparent",
              }}>
                <input
                  type="radio"
                  name="authMode"
                  checked={authMode === mode}
                  onChange={() => handleChange(mode)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {description}
                  </div>
                </div>
              </label>
            ))}

            {saved && (
              <p style={{ color: "var(--color-primary)", fontSize: 12, marginTop: 8 }}>
                Settings saved.
              </p>
            )}
          </fieldset>
        )}
      </div>
    </div>
  );
}
