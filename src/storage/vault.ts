import type { Credential } from "./types";
import { MOCK_CREDENTIALS } from "./mock-data";

let credentials: Credential[] = [...MOCK_CREDENTIALS];

export function getAll(): Credential[] {
  return [...credentials];
}

export function getById(id: string): Credential | undefined {
  return credentials.find((c) => c.id === id);
}

export function search(query: string): Credential[] {
  const q = query.toLowerCase();
  return credentials.filter(
    (c) =>
      c.url.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q)
  );
}

export function add(
  data: Pick<Credential, "url" | "username" | "password">
): Credential {
  const now = Date.now();
  const entry: Credential = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  credentials = [...credentials, entry];
  return entry;
}

export function update(
  id: string,
  data: Partial<Pick<Credential, "url" | "username" | "password">>
): Credential | undefined {
  const idx = credentials.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const updated = { ...credentials[idx], ...data, updatedAt: Date.now() };
  credentials = credentials.map((c) => (c.id === id ? updated : c));
  return updated;
}

export function remove(id: string): boolean {
  const len = credentials.length;
  credentials = credentials.filter((c) => c.id !== id);
  return credentials.length < len;
}

export function reset(): void {
  credentials = [...MOCK_CREDENTIALS];
}
