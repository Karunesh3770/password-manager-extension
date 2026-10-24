import { describe, it, expect } from "vitest";
import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  createVerifyToken,
  checkVerifyToken,
} from "./index";

describe("cryptography", () => {
  it("generates a 16-byte salt", () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);
  });

  it("derives a CryptoKey from password and salt", async () => {
    const salt = generateSalt();
    const key = await deriveKey("test-master-password", salt);
    expect(key).toBeDefined();
    expect(key.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
  });

  it("encrypts and decrypts a string", async () => {
    const salt = generateSalt();
    const key = await deriveKey("my-password", salt);
    const plaintext = "hello-secret-world";
    const ciphertext = await encrypt(plaintext, key);
    expect(ciphertext).not.toBe(plaintext);
    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const salt = generateSalt();
    const key = await deriveKey("my-password", salt);
    const a = await encrypt("same-text", key);
    const b = await encrypt("same-text", key);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with wrong key", async () => {
    const salt = generateSalt();
    const key1 = await deriveKey("password-1", salt);
    const key2 = await deriveKey("password-2", salt);
    const encrypted = await encrypt("secret", key1);
    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });

  it("creates and verifies a verify token", async () => {
    const salt = generateSalt();
    const key = await deriveKey("master", salt);
    const token = await createVerifyToken(key);
    expect(await checkVerifyToken(token, key)).toBe(true);
  });

  it("rejects verify token with wrong key", async () => {
    const salt = generateSalt();
    const key1 = await deriveKey("master", salt);
    const key2 = await deriveKey("wrong", salt);
    const token = await createVerifyToken(key1);
    expect(await checkVerifyToken(token, key2)).toBe(false);
  });
});
