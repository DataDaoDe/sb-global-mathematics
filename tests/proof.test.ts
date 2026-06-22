import { beforeAll, describe, expect, it } from "vitest";

import {
  ProofSchema,
  isProof,
  loadEntityFile,
  mathematicsPath,
  parseProof,
  type Proof,
} from "../src/index.js";

const proofFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "propositions",
  "specializes-associative-unital",
  "proofs",
  "direct-from-definition.yaml",
);

describe("Proof", () => {
  let proof: Proof;

  beforeAll(async () => {
    proof = parseProof(await loadEntityFile(proofFile));
  });

  it("loads a concrete proof from the repository", () => {
    expect(proof).toEqual({
      id: "algebra.ring.commutative-unital.proposition.specializes-associative-unital.proof.direct-from-definition",
      kind: "proof",
      title: "Direct proof from the definition",
      proves: [
        "algebra.ring.commutative-unital.proposition.specializes-associative-unital",
      ],
      method: "direct proof",
      argument:
        "By definition, a commutative unital ring is a ring with a multiplicative identity whose multiplication is commutative. The referenced definition depends on the concept of an associative unital ring, so every commutative unital ring satisfies the requirements of an associative unital ring.",
      display_math: [
        {
          latex:
            "\\mathrm{CommutativeUnitalRing}(R) \\Rightarrow \\mathrm{AssociativeUnitalRing}(R)",
          description:
            "The implication proved directly from the definition.",
        },
      ],
      depends_on: [
        "algebra.ring.commutative-unital.proposition.specializes-associative-unital",
        "algebra.ring.commutative-unital.definition",
        "algebra.ring.associative-unital.definition",
      ],
      source_refs: [
        {
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
          note:
            "Direct definitional argument using the standard ring definitions.",
        },
      ],
    });
  });

  it("represents a valid Proof", () => {
    expect(ProofSchema.safeParse(proof).success).toBe(true);
    expect(isProof(proof)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseProof(proof)).toEqual(proof);
  });

  it("rejects an empty proved proposition list", () => {
    const result = ProofSchema.safeParse({
      ...proof,
      proves: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty method", () => {
    const result = ProofSchema.safeParse({
      ...proof,
      method: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty argument", () => {
    const result = ProofSchema.safeParse({
      ...proof,
      argument: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty display math", () => {
    const result = ProofSchema.safeParse({
      ...proof,
      display_math: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate proved propositions", () => {
    const [propositionId] = proof.proves;

    if (propositionId === undefined) {
      throw new Error("Repository proof proves no proposition");
    }

    const result = ProofSchema.safeParse({
      ...proof,
      proves: [
        propositionId,
        propositionId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate dependencies", () => {
    const [dependencyId] = proof.depends_on;

    if (dependencyId === undefined) {
      throw new Error("Repository proof has no dependency");
    }

    const result = ProofSchema.safeParse({
      ...proof,
      depends_on: [
        dependencyId,
        dependencyId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate source references", () => {
    const [sourceId] = proof.source_refs;

    if (sourceId === undefined) {
      throw new Error("Repository proof has no source reference");
    }

    const result = ProofSchema.safeParse({
      ...proof,
      source_refs: [
        sourceId,
        sourceId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = ProofSchema.safeParse({
      ...proof,
      confidence: "obvious",
    });

    expect(result.success).toBe(false);
  });
});
