import type { Message, MessageResponse, Credential, Settings } from "../../storage/types";

function send(message: Message): Promise<MessageResponse> {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    return chrome.runtime.sendMessage(message);
  }
  return Promise.resolve({ ok: false, error: "Chrome APIs not available" });
}

export async function setup(
  masterPassword: string,
  email?: string
): Promise<{ recoveryKey: string }> {
  const res = await send({ type: "SETUP", payload: { masterPassword, email } });
  if (!res.ok) throw new Error(res.error);
  return res.data as { recoveryKey: string };
}

export async function unlock(masterPassword: string): Promise<void> {
  const res = await send({ type: "UNLOCK", payload: { masterPassword } });
  if (!res.ok) throw new Error(res.error);
}

export async function lock(): Promise<void> {
  await send({ type: "LOCK" });
}

export async function isSetup(): Promise<boolean> {
  const res = await send({ type: "IS_SETUP" });
  return res.ok && (res.data as boolean);
}

export async function isUnlocked(): Promise<boolean> {
  const res = await send({ type: "IS_UNLOCKED" });
  return res.ok && (res.data as boolean);
}

export async function getAll(): Promise<Credential[]> {
  const res = await send({ type: "GET_ALL" });
  if (!res.ok) throw new Error(res.error);
  return res.data as Credential[];
}

export async function searchCredentials(query: string): Promise<Credential[]> {
  const res = await send({ type: "SEARCH", payload: { query } });
  if (!res.ok) throw new Error(res.error);
  return res.data as Credential[];
}

export async function addCredential(
  url: string,
  username: string,
  password: string
): Promise<void> {
  const res = await send({ type: "ADD", payload: { url, username, password } });
  if (!res.ok) throw new Error(res.error);
}

export async function updateCredential(
  id: string,
  url: string,
  username: string,
  password: string
): Promise<void> {
  const res = await send({
    type: "UPDATE",
    payload: { id, url, username, password },
  });
  if (!res.ok) throw new Error(res.error);
}

export async function deleteCredential(id: string): Promise<void> {
  const res = await send({ type: "DELETE", payload: { id } });
  if (!res.ok) throw new Error(res.error);
}

export async function getPendingCount(): Promise<number> {
  const res = await send({ type: "GET_PENDING_COUNT" });
  if (!res.ok) return 0;
  return res.data as number;
}

export async function getSettings(): Promise<Settings> {
  const res = await send({ type: "GET_SETTINGS" });
  if (!res.ok) return { authMode: "every_fill" };
  return res.data as Settings;
}

export async function setSettings(settings: Settings): Promise<void> {
  const res = await send({ type: "SET_SETTINGS", payload: settings });
  if (!res.ok) throw new Error(res.error);
}

export async function verifyForFill(masterPassword: string): Promise<void> {
  const res = await send({
    type: "VERIFY_FOR_FILL",
    payload: { masterPassword },
  });
  if (!res.ok) throw new Error(res.error);
}

export async function recoverPassword(
  recoveryKey: string,
  newMasterPassword: string
): Promise<void> {
  const res = await send({
    type: "RECOVER_PASSWORD",
    payload: { recoveryKey, newMasterPassword },
  });
  if (!res.ok) throw new Error(res.error);
}

export async function getRecoveryEmail(): Promise<string> {
  const res = await send({ type: "GET_RECOVERY_EMAIL" });
  if (!res.ok) return "";
  return res.data as string;
}

export async function setupRecovery(
  email?: string
): Promise<{ recoveryKey: string }> {
  const res = await send({ type: "SETUP_RECOVERY", payload: { email } });
  if (!res.ok) throw new Error(res.error);
  return res.data as { recoveryKey: string };
}
