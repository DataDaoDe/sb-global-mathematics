import { describe, expect, it } from "vitest";

import {
  EntityBaseSchema,
  EntityKindSchema,
  EntityTitleSchema,
} from "../src/index.js";

describe("EntityKind", () => {
  it.each([
    "concept",
    "definition",
    "proposition",
    "proof",
    "example",
    "counterexample",
    "question",
    "source",
  ])("accepts valid kind: %s", (kind) => {
    expect(EntityKindSchema.safeParse(kind).success).toBe(true);
  });

  it.each([
    "theorem",
    "lemma",
    "exercise",
    "Concept",
    "",
  ])("rejects unsupported kind: %s", (kind) => {
    expect(EntityKindSchema.safeParse(kind).success).toBe(false);
  });
});

describe("EntityTitle", () => {
  it("accepts a non-empty title", () => {
    expect(
      EntityTitleSchema.safeParse("Commutative unital ring").success,
    ).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const title = EntityTitleSchema.parse("  Group  ");

    expect(title).toBe("Group");
  });

  it.each([
    "",
    " ",
    "\n\t",
  ])("rejects an empty title: %j", (title) => {
    expect(EntityTitleSchema.safeParse(title).success).toBe(false);
  });

  it("rejects titles longer than 200 characters", () => {
    const title = "a".repeat(201);

    expect(EntityTitleSchema.safeParse(title).success).toBe(false);
  });
});

describe("EntityBase", () => {
  it("accepts a valid entity base", () => {
    const result = EntityBaseSchema.safeParse({
      id: "algebra.group",
      kind: "concept",
      title: "Group",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid entity ID", () => {
    const result = EntityBaseSchema.safeParse({
      id: "Group",
      kind: "concept",
      title: "Group",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unsupported kind", () => {
    const result = EntityBaseSchema.safeParse({
      id: "algebra.group",
      kind: "exercise",
      title: "Group",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = EntityBaseSchema.safeParse({
      id: "algebra.group",
      kind: "concept",
      title: "Group",
      unexpected: true,
    });

    expect(result.success).toBe(false);
  });
});
