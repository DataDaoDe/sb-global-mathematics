import { describe, expect, it } from "vitest";

import {
  EntityIdSchema,
  isEntityId,
  parseEntityId,
} from "../src/index.js";

describe("EntityId", () => {
  it.each([
    "algebra.group",
    "algebra.ring.commutative-unital",
    "algebra.ring.commutative-unital.definition",
    "topology.separation.t0-space",
    "analysis.function.l2-space",
    "number-system.integers",
  ])("accepts valid ID: %s", (value) => {
    expect(EntityIdSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    "",
    "algebra",
    "Ring",
    "algebra.Ring",
    "algebra..ring",
    ".algebra.ring",
    "algebra.ring.",
    "algebra ring",
    "algebra_ring",
    "algebra.-ring",
    "algebra.ring-",
    "algebra.commutative--ring",
    " algebra.ring",
    "algebra.ring ",
  ])("rejects invalid ID: %s", (value) => {
    expect(EntityIdSchema.safeParse(value).success).toBe(false);
  });

  it("parses a valid ID", () => {
    const id = parseEntityId("algebra.ring.commutative-unital");

    expect(id).toBe("algebra.ring.commutative-unital");
  });

  it("throws when parsing an invalid ID", () => {
    expect(() => parseEntityId("Algebra.Ring")).toThrow();
  });

  it("provides a type guard", () => {
    const candidate: unknown = "algebra.group";

    expect(isEntityId(candidate)).toBe(true);
  });
});