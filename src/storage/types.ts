export interface Credential {
  id: string;
  url: string;
  username: string;
  password: string;
  createdAt: number;
  updatedAt: number;
}

export interface EncryptedCredential {
  id: string;
  url: string;
  username: string;
  encryptedPassword: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  salt: string;
  verifyToken: string;
  wrappedVaultKey?: string;
  recoverySalt?: string;
  recoveryWrappedVaultKey?: string;
  recoveryEmail?: string;
  credentials: EncryptedCredential[];
}

export type AuthMode = "none" | "login_only" | "every_fill";

export interface Settings {
  authMode: AuthMode;
}

export type Message =
  | { type: "SETUP"; payload: { masterPassword: string; email?: string } }
  | { type: "UNLOCK"; payload: { masterPassword: string } }
  | { type: "LOCK" }
  | { type: "IS_SETUP" }
  | { type: "IS_UNLOCKED" }
  | { type: "GET_ALL" }
  | { type: "SEARCH"; payload: { query: string } }
  | { type: "ADD"; payload: { url: string; username: string; password: string } }
  | { type: "UPDATE"; payload: { id: string; url: string; username: string; password: string } }
  | { type: "DELETE"; payload: { id: string } }
  | { type: "CREDENTIAL_CAPTURED"; payload: { url: string; username: string; password: string } }
  | { type: "GET_PENDING_COUNT" }
  | { type: "GET_MATCHES"; payload: { url: string } }
  | { type: "GET_SETTINGS" }
  | { type: "SET_SETTINGS"; payload: Settings }
  | { type: "VERIFY_FOR_FILL"; payload: { masterPassword: string } }
  | { type: "RECOVER_PASSWORD"; payload: { recoveryKey: string; newMasterPassword: string } }
  | { type: "SETUP_RECOVERY"; payload: { email?: string } }
  | { type: "GET_RECOVERY_EMAIL" };

export type MessageResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };
