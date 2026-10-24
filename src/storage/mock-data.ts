import type { Credential } from "./types";

export const MOCK_CREDENTIALS: Credential[] = [
  {
    id: "1",
    url: "https://github.com",
    username: "dev@example.com",
    password: "mock-password-gh-123",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: "2",
    url: "https://gitlab.com",
    username: "user@example.com",
    password: "mock-password-gl-456",
    createdAt: 1700100000000,
    updatedAt: 1700100000000,
  },
  {
    id: "3",
    url: "https://mail.google.com",
    username: "demo@gmail.com",
    password: "mock-password-gm-789",
    createdAt: 1700200000000,
    updatedAt: 1700200000000,
  },
];
