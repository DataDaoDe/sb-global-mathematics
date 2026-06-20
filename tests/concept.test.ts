import { beforeAll, describe, expect, it } from "vitest";

import {
  ConceptSchema,
  isConcept,
  loadEntityFile,
  mathematicsPath,
  parseConcept,
  type Concept,
} from "../src/index.js";

const conceptFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "concept.yaml",
);

describe("Concept", () => {
  let concept: Concept;

  beforeAll(async () => {
    concept = parseConcept(await loadEntityFile(conceptFile));
  });

  it("loads a concrete concept from the repository", () => {
    expect(concept).toEqual({
      id: "algebra.ring.commutative-unital",
      kind: "concept",
      title: "Commutative unital ring",
      summary:
        "An associative ring with a multiplicative identity whose multiplication is commutative.",
      display_math: [
        {
          latex: "\\forall a,b \\in R,\\; ab = ba",
          description: "Multiplication is commutative.",
        },
        {
          latex:
            "\\exists 1_R \\in R\\; \\forall a \\in R,\\; 1_Ra = a1_R = a",
          description: "A multiplicative identity exists.",
        },
      ],
      defined_by: [
        "algebra.ring.commutative-unital.definition",
      ],
      broader_concepts: [
        "algebra.ring.associative-unital",
      ],
    });
  });

  it("represents a valid Concept", () => {
    expect(ConceptSchema.safeParse(concept).success).toBe(true);
    expect(isConcept(concept)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseConcept(concept)).toEqual(concept);
  });

  it("rejects an empty definition list", () => {
    const result = ConceptSchema.safeParse({
      ...concept,
      defined_by: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty summary", () => {
    const result = ConceptSchema.safeParse({
      ...concept,
      summary: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing display math", () => {
    const { display_math: _displayMath, ...candidate } = concept;
    const result = ConceptSchema.safeParse(candidate);

    expect(result.success).toBe(false);
  });

  it("rejects an invalid definition ID", () => {
    const result = ConceptSchema.safeParse({
      ...concept,
      defined_by: ["Invalid Definition"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate definition references", () => {
    const [definitionId] = concept.defined_by;

    if (definitionId === undefined) {
      throw new Error(
        "Repository concept has no definition reference",
      );
    }

    const result = ConceptSchema.safeParse({
      ...concept,
      defined_by: [
        definitionId,
        definitionId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate broader concepts", () => {
    const [broaderConceptId] = concept.broader_concepts;

    if (broaderConceptId === undefined) {
      throw new Error(
        "Repository concept has no broader concept",
      );
    }

    const result = ConceptSchema.safeParse({
      ...concept,
      broader_concepts: [
        broaderConceptId,
        broaderConceptId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects self-reference as a broader concept", () => {
    const result = ConceptSchema.safeParse({
      ...concept,
      broader_concepts: [concept.id],
    });

    expect(result.success).toBe(false);
  });

  it("rejects the wrong entity kind", () => {
    const result = ConceptSchema.safeParse({
      ...concept,
      kind: "definition",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = ConceptSchema.safeParse({
      ...concept,
      difficulty: "advanced",
    });

    expect(result.success).toBe(false);
  });
});
