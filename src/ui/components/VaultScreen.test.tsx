import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VaultScreen } from "./VaultScreen";
import type { Credential } from "../../storage/types";

const mockCredentials: Credential[] = [
  { id: "1", url: "https://github.com", username: "dev@example.com", password: "pw1", createdAt: 1, updatedAt: 1 },
  { id: "2", url: "https://gitlab.com", username: "user@example.com", password: "pw2", createdAt: 2, updatedAt: 2 },
];

vi.mock("../api/vault-api", () => ({
  getAll: vi.fn(() => Promise.resolve([...mockCredentials])),
  searchCredentials: vi.fn((q: string) =>
    Promise.resolve(mockCredentials.filter((c) => c.url.includes(q)))
  ),
  deleteCredential: vi.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VaultScreen", () => {
  it("renders the vault header and add button", async () => {
    render(<VaultScreen onAdd={vi.fn()} onEdit={vi.fn()} onLock={vi.fn()} onSettings={vi.fn()} />);
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("+ Add")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("https://github.com")).toBeInTheDocument();
    });
  });

  it("renders credentials after loading", async () => {
    render(<VaultScreen onAdd={vi.fn()} onEdit={vi.fn()} onLock={vi.fn()} onSettings={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("https://github.com")).toBeInTheDocument();
      expect(screen.getByText("https://gitlab.com")).toBeInTheDocument();
    });
  });

  it("calls onAdd when clicking + Add", async () => {
    const onAdd = vi.fn();
    render(<VaultScreen onAdd={onAdd} onEdit={vi.fn()} onLock={vi.fn()} onSettings={vi.fn()} />);
    fireEvent.click(screen.getByText("+ Add"));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("calls onLock when clicking Lock", async () => {
    const onLock = vi.fn();
    render(<VaultScreen onAdd={vi.fn()} onEdit={vi.fn()} onLock={onLock} onSettings={vi.fn()} />);
    fireEvent.click(screen.getByText("Lock"));
    expect(onLock).toHaveBeenCalledOnce();
  });
});
