import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CredentialForm } from "./CredentialForm";
import type { Credential } from "../../storage/types";

const mocks = vi.hoisted(() => ({
  addCredential: vi.fn((): Promise<void> => Promise.resolve()),
  updateCredential: vi.fn((): Promise<void> => Promise.resolve()),
}));

vi.mock("../api/vault-api", () => mocks);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CredentialForm", () => {
  it("renders add mode with empty fields", () => {
    render(<CredentialForm onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add Credential" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://example.com")).toHaveValue("");
  });

  it("renders edit mode with pre-filled fields", () => {
    const cred: Credential = {
      id: "1", url: "https://github.com", username: "user", password: "pass",
      createdAt: 1, updatedAt: 1,
    };
    render(<CredentialForm editing={cred} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Edit Credential" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://example.com")).toHaveValue("https://github.com");
  });

  it("calls onBack when clicking Back", () => {
    const onBack = vi.fn();
    render(<CredentialForm onBack={onBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("adds a new credential on submit", async () => {
    const onBack = vi.fn();
    render(<CredentialForm onBack={onBack} />);

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://new.example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("user@example.com"), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password"), {
      target: { value: "newpass" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Add Credential" }));

    await waitFor(() => {
      expect(mocks.addCredential).toHaveBeenCalledWith(
        "https://new.example.com", "newuser", "newpass"
      );
      expect(onBack).toHaveBeenCalledOnce();
    });
  });
});
