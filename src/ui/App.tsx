import { useEffect, useState } from "react";
import { VaultScreen } from "./components/VaultScreen";
import { CredentialForm } from "./components/CredentialForm";
import { SetupScreen } from "./components/SetupScreen";
import { LockScreen } from "./components/LockScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import * as api from "./api/vault-api";
import type { Credential } from "../storage/types";

type Screen =
  | { name: "loading" }
  | { name: "setup" }
  | { name: "locked" }
  | { name: "vault" }
  | { name: "form"; editing?: Credential }
  | { name: "settings" };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" });

  useEffect(() => {
    async function init() {
      try {
        const setup = await api.isSetup();
        if (!setup) {
          setScreen({ name: "setup" });
          return;
        }
        const unlocked = await api.isUnlocked();
        setScreen(unlocked ? { name: "vault" } : { name: "locked" });
      } catch {
        setScreen({ name: "vault" });
      }
    }
    init();
  }, []);

  if (screen.name === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (screen.name === "setup") {
    return <SetupScreen onDone={() => setScreen({ name: "vault" })} />;
  }

  if (screen.name === "locked") {
    return <LockScreen onUnlocked={() => setScreen({ name: "vault" })} />;
  }

  if (screen.name === "form") {
    return (
      <CredentialForm
        editing={screen.editing}
        onBack={() => setScreen({ name: "vault" })}
      />
    );
  }

  if (screen.name === "settings") {
    return <SettingsScreen onBack={() => setScreen({ name: "vault" })} />;
  }

  return (
    <VaultScreen
      onAdd={() => setScreen({ name: "form" })}
      onEdit={(c) => setScreen({ name: "form", editing: c })}
      onLock={() => {
        api.lock();
        setScreen({ name: "locked" });
      }}
      onSettings={() => setScreen({ name: "settings" })}
    />
  );
}
