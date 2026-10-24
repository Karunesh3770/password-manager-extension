import { describe, it, expect, beforeEach } from "vitest";
import { getAll, getById, search, add, update, remove, reset } from "./vault";

beforeEach(() => {
  reset();
});

describe("vault storage", () => {
  it("returns all mock credentials", () => {
    expect(getAll()).toHaveLength(3);
  });

  it("finds a credential by id", () => {
    const found = getById("1");
    expect(found).toBeDefined();
    expect(found!.url).toBe("https://github.com");
  });

  it("returns undefined for unknown id", () => {
    expect(getById("unknown")).toBeUndefined();
  });

  it("searches by URL", () => {
    const results = search("github");
    expect(results).toHaveLength(1);
    expect(results[0].url).toContain("github");
  });

  it("searches by username", () => {
    const results = search("demo@gmail");
    expect(results).toHaveLength(1);
  });

  it("adds a credential", () => {
    const entry = add({ url: "https://example.com", username: "test", password: "pw" });
    expect(entry.id).toBeDefined();
    expect(getAll()).toHaveLength(4);
  });

  it("updates a credential", () => {
    const updated = update("1", { username: "new-user" });
    expect(updated).toBeDefined();
    expect(updated!.username).toBe("new-user");
    expect(getById("1")!.username).toBe("new-user");
  });

  it("returns undefined when updating unknown id", () => {
    expect(update("unknown", { username: "x" })).toBeUndefined();
  });

  it("removes a credential", () => {
    expect(remove("1")).toBe(true);
    expect(getAll()).toHaveLength(2);
  });

  it("returns false when removing unknown id", () => {
    expect(remove("unknown")).toBe(false);
  });
});
