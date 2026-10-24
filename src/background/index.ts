import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  createVerifyToken,
  checkVerifyToken,
  toBase64,
  fromBase64,
  generateVaultKey,
  wrapVaultKey,
  unwrapVaultKey,
  generateRecoveryKey,
} from "../cryptography/index";
import type {
  Message,
  MessageResponse,
  EncryptedCredential,
  Credential,
  VaultData,
  Settings,
} from "../storage/types";

let cachedKey: CryptoKey | null = null;
let pendingCaptures: { url: string; username: string; password: string }[] = [];

const DEFAULT_SETTINGS: Settings = { authMode: "every_fill" };

async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get("settings");
  return result.settings ?? DEFAULT_SETTINGS;
}

async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

async function loadVault(): Promise<VaultData | null> {
  const result = await chrome.storage.local.get("vault");
  return result.vault ?? null;
}

async function saveVault(vault: VaultData): Promise<void> {
  await chrome.storage.local.set({ vault });
}

async function decryptCredential(
  ec: EncryptedCredential,
  key: CryptoKey
): Promise<Credential> {
  const password = await decrypt(ec.encryptedPassword, key);
  return {
    id: ec.id,
    url: ec.url,
    username: ec.username,
    password,
    createdAt: ec.createdAt,
    updatedAt: ec.updatedAt,
  };
}

async function getAllDecrypted(key: CryptoKey): Promise<Credential[]> {
  const vault = await loadVault();
  if (!vault) return [];
  return Promise.all(vault.credentials.map((c) => decryptCredential(c, key)));
}

async function addCredential(
  url: string,
  username: string,
  password: string,
  key: CryptoKey
): Promise<void> {
  const vault = await loadVault();
  if (!vault) return;
  const now = Date.now();
  const encryptedPassword = await encrypt(password, key);
  const entry: EncryptedCredential = {
    id: crypto.randomUUID(),
    url,
    username,
    encryptedPassword,
    createdAt: now,
    updatedAt: now,
  };
  vault.credentials.push(entry);
  await saveVault(vault);
}

async function updateCredential(
  id: string,
  url: string,
  username: string,
  password: string,
  key: CryptoKey
): Promise<void> {
  const vault = await loadVault();
  if (!vault) return;
  const idx = vault.credentials.findIndex((c) => c.id === id);
  if (idx === -1) return;
  vault.credentials[idx] = {
    ...vault.credentials[idx],
    url,
    username,
    encryptedPassword: await encrypt(password, key),
    updatedAt: Date.now(),
  };
  await saveVault(vault);
}

async function deleteCredential(id: string): Promise<void> {
  const vault = await loadVault();
  if (!vault) return;
  vault.credentials = vault.credentials.filter((c) => c.id !== id);
  await saveVault(vault);
}

async function upsertCaptured(
  url: string,
  username: string,
  password: string,
  key: CryptoKey
): Promise<boolean> {
  const vault = await loadVault();
  if (!vault) return false;
  const existing = vault.credentials.find(
    (c) => c.url === url && c.username === username
  );
  if (existing) {
    await updateCredential(existing.id, url, username, password, key);
    return true;
  }
  await addCredential(url, username, password, key);
  return true;
}

async function processPending(key: CryptoKey): Promise<void> {
  const captures = [...pendingCaptures];
  pendingCaptures = [];
  for (const cap of captures) {
    await upsertCaptured(cap.url, cap.username, cap.password, key);
  }
}

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case "IS_SETUP": {
      const vault = await loadVault();
      return { ok: true, data: vault !== null };
    }

    case "IS_UNLOCKED": {
      return { ok: true, data: cachedKey !== null };
    }

    case "SETUP": {
      const salt = generateSalt();
      const masterKey = await deriveKey(message.payload.masterPassword, salt);
      const verifyToken = await createVerifyToken(masterKey);

      const vaultKey = await generateVaultKey();
      const wrappedVaultKey = await wrapVaultKey(vaultKey, masterKey);

      const recoveryKeyStr = generateRecoveryKey();
      const recoverySalt = generateSalt();
      const recoveryDerivedKey = await deriveKey(
        recoveryKeyStr.replace(/-/g, ""),
        recoverySalt
      );
      const recoveryWrappedVaultKey = await wrapVaultKey(vaultKey, recoveryDerivedKey);

      const vault: VaultData = {
        salt: toBase64(salt.buffer),
        verifyToken,
        wrappedVaultKey,
        recoverySalt: toBase64(recoverySalt.buffer),
        recoveryWrappedVaultKey,
        recoveryEmail: message.payload.email ?? "",
        credentials: [],
      };
      await saveVault(vault);
      cachedKey = vaultKey;
      await processPending(vaultKey);
      return { ok: true, data: { recoveryKey: recoveryKeyStr } };
    }

    case "UNLOCK": {
      const vault = await loadVault();
      if (!vault) return { ok: false, error: "Vault not set up" };
      const salt = fromBase64(vault.salt);
      const masterKey = await deriveKey(message.payload.masterPassword, salt);
      const valid = await checkVerifyToken(vault.verifyToken, masterKey);
      if (!valid) return { ok: false, error: "Wrong master password" };

      if (vault.wrappedVaultKey) {
        cachedKey = await unwrapVaultKey(vault.wrappedVaultKey, masterKey);
      } else {
        const vaultKey = await generateVaultKey();
        const newCreds: EncryptedCredential[] = [];
        for (const ec of vault.credentials) {
          const pw = await decrypt(ec.encryptedPassword, masterKey);
          newCreds.push({
            ...ec,
            encryptedPassword: await encrypt(pw, vaultKey),
          });
        }
        vault.wrappedVaultKey = await wrapVaultKey(vaultKey, masterKey);
        vault.credentials = newCreds;
        await saveVault(vault);
        cachedKey = vaultKey;
      }

      await processPending(cachedKey);
      return { ok: true };
    }

    case "LOCK": {
      cachedKey = null;
      return { ok: true };
    }

    case "GET_ALL": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      const creds = await getAllDecrypted(cachedKey);
      return { ok: true, data: creds };
    }

    case "SEARCH": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      const all = await getAllDecrypted(cachedKey);
      const q = message.payload.query.toLowerCase();
      const filtered = all.filter(
        (c) =>
          c.url.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q)
      );
      return { ok: true, data: filtered };
    }

    case "ADD": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      const { url, username, password } = message.payload;
      const vault = await loadVault();
      if (vault) {
        const duplicate = vault.credentials.find(
          (c) => c.url === url && c.username === username
        );
        if (duplicate) {
          return {
            ok: false,
            error: "A credential for this site and username already exists.",
          };
        }
      }
      await addCredential(url, username, password, cachedKey);
      return { ok: true };
    }

    case "UPDATE": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      const { id, url, username, password } = message.payload;
      await updateCredential(id, url, username, password, cachedKey);
      return { ok: true };
    }

    case "DELETE": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      await deleteCredential(message.payload.id);
      return { ok: true };
    }

    case "CREDENTIAL_CAPTURED": {
      const { url, username, password } = message.payload;
      if (cachedKey) {
        await upsertCaptured(url, username, password, cachedKey);
        chrome.action.setBadgeText({ text: "+" });
        chrome.action.setBadgeBackgroundColor({ color: "#4263eb" });
        setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
      } else {
        pendingCaptures.push({ url, username, password });
        chrome.action.setBadgeText({ text: String(pendingCaptures.length) });
        chrome.action.setBadgeBackgroundColor({ color: "#e03131" });
      }
      return { ok: true };
    }

    case "GET_PENDING_COUNT": {
      return { ok: true, data: pendingCaptures.length };
    }

    case "GET_MATCHES": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      const all = await getAllDecrypted(cachedKey);
      const requestOrigin = message.payload.url;
      const matches = all.filter((c) => {
        try {
          const storedOrigin = new URL(c.url).origin;
          return storedOrigin === requestOrigin;
        } catch {
          return (
            c.url.includes(requestOrigin) || requestOrigin.includes(c.url)
          );
        }
      });
      return { ok: true, data: matches };
    }

    case "GET_SETTINGS": {
      const settings = await loadSettings();
      return { ok: true, data: settings };
    }

    case "SET_SETTINGS": {
      await saveSettings(message.payload);
      return { ok: true };
    }

    case "VERIFY_FOR_FILL": {
      const vault = await loadVault();
      if (!vault) return { ok: false, error: "Vault not set up" };
      const salt = fromBase64(vault.salt);
      const key = await deriveKey(message.payload.masterPassword, salt);
      const valid = await checkVerifyToken(vault.verifyToken, key);
      if (!valid) return { ok: false, error: "Wrong master password" };
      if (!cachedKey) {
        if (vault.wrappedVaultKey) {
          cachedKey = await unwrapVaultKey(vault.wrappedVaultKey, key);
        } else {
          cachedKey = key;
        }
      }
      return { ok: true };
    }

    case "RECOVER_PASSWORD": {
      const vault = await loadVault();
      if (!vault) return { ok: false, error: "Vault not set up" };
      if (!vault.recoverySalt || !vault.recoveryWrappedVaultKey) {
        return { ok: false, error: "Recovery not set up for this vault" };
      }

      const recoverySalt = fromBase64(vault.recoverySalt);
      const recoveryDerivedKey = await deriveKey(
        message.payload.recoveryKey.replace(/-/g, ""),
        recoverySalt
      );

      let vaultKey: CryptoKey;
      try {
        vaultKey = await unwrapVaultKey(
          vault.recoveryWrappedVaultKey,
          recoveryDerivedKey
        );
      } catch {
        return { ok: false, error: "Invalid recovery key" };
      }

      const newSalt = generateSalt();
      const newMasterKey = await deriveKey(
        message.payload.newMasterPassword,
        newSalt
      );
      const newVerifyToken = await createVerifyToken(newMasterKey);
      const newWrappedVaultKey = await wrapVaultKey(vaultKey, newMasterKey);

      vault.salt = toBase64(newSalt.buffer);
      vault.verifyToken = newVerifyToken;
      vault.wrappedVaultKey = newWrappedVaultKey;
      await saveVault(vault);

      cachedKey = vaultKey;
      await processPending(cachedKey);
      return { ok: true };
    }

    case "SETUP_RECOVERY": {
      if (!cachedKey) return { ok: false, error: "Vault is locked" };
      const vault = await loadVault();
      if (!vault) return { ok: false, error: "Vault not set up" };

      const recoveryKeyStr = generateRecoveryKey();
      const recoverySalt = generateSalt();
      const recoveryDerivedKey = await deriveKey(
        recoveryKeyStr.replace(/-/g, ""),
        recoverySalt
      );
      const recoveryWrappedVaultKey = await wrapVaultKey(
        cachedKey,
        recoveryDerivedKey
      );

      vault.recoverySalt = toBase64(recoverySalt.buffer);
      vault.recoveryWrappedVaultKey = recoveryWrappedVaultKey;
      vault.recoveryEmail = message.payload.email ?? "";
      await saveVault(vault);

      return { ok: true, data: { recoveryKey: recoveryKeyStr } };
    }

    case "GET_RECOVERY_EMAIL": {
      const vault = await loadVault();
      if (!vault) return { ok: false, error: "Vault not set up" };
      return { ok: true, data: vault.recoveryEmail ?? "" };
    }

    default:
      return { ok: false, error: "Unknown message type" };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message as Message).then(sendResponse);
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Password Manager extension installed.");
});
