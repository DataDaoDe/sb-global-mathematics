import { beforeAll, describe, expect, it } from "vitest";

import {
  PropositionSchema,
  PropositionTypeSchema,
  isProposition,
  loadEntityFile,
  mathematicsPath,
  parseProposition,
  type Proposition,
} from "../src/index.js";

const propositionFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "propositions",
  "specializes-associative-unital.yaml",
);

describe("PropositionType", () => {
  it.each([
    "theorem",
    "lemma",
    "proposition",
    "corollary",
  ])("accepts valid proposition type: %s", (type) => {
    expect(PropositionTypeSchema.safeParse(type).success).toBe(true);
  });

  it.each([
    "claim",
    "Theorem",
    "",
  ])("rejects unsupported proposition type: %s", (type) => {
    expect(PropositionTypeSchema.safeParse(type).success).toBe(false);
  });
});

describe("Proposition", () => {
  let proposition: Proposition;

  beforeAll(async () => {
    proposition = parseProposition(
      await loadEntityFile(propositionFile),
    );
  });

  it("loads a concrete proposition from the repository", () => {
    expect(proposition).toEqual({
      id: "algebra.ring.commutative-unital.proposition.specializes-associative-unital",
      kind: "proposition",
      title: "Every commutative unital ring is an associative unital ring",
      proposition_type: "proposition",
      claim:
        "Every commutative unital ring is an associative unital ring.",
      display_math: [
        {
          latex:
            "\\mathrm{CommutativeUnitalRing}(R) \\Rightarrow \\mathrm{AssociativeUnitalRing}(R)",
          description:
            "Every commutative unital ring is an associative unital ring.",
        },
      ],
      depends_on: [
        "algebra.ring.commutative-unital.definition",
        "algebra.ring.associative-unital",
      ],
      source_refs: [
        "source.dummit-foote-abstract-algebra-third-edition",
      ],
    });
  });

  it("represents a valid Proposition", () => {
    expect(PropositionSchema.safeParse(proposition).success).toBe(true);
    expect(isProposition(proposition)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseProposition(proposition)).toEqual(proposition);
  });

  it("rejects an empty claim", () => {
    const result = PropositionSchema.safeParse({
      ...proposition,
      claim: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty display math", () => {
    const result = PropositionSchema.safeParse({
      ...proposition,
      display_math: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate dependencies", () => {
    const [dependencyId] = proposition.depends_on;

    if (dependencyId === undefined) {
      throw new Error("Repository proposition has no dependency");
    }

    const result = PropositionSchema.safeParse({
      ...proposition,
      depends_on: [
        dependencyId,
        dependencyId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate source references", () => {
    const [sourceId] = proposition.source_refs;

    if (sourceId === undefined) {
      throw new Error("Repository proposition has no source reference");
    }

    const result = PropositionSchema.safeParse({
      ...proposition,
      source_refs: [
        sourceId,
        sourceId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = PropositionSchema.safeParse({
      ...proposition,
      proof: "inline proof is not part of a proposition",
    });

    expect(result.success).toBe(false);
  });
});
