import { beforeAll, describe, expect, it } from "vitest";

import {
  DefinitionSchema,
  isDefinition,
  loadEntityFile,
  mathematicsPath,
  parseDefinition,
  type Definition,
} from "../src/index.js";

const definitionFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "definition.yaml",
);

describe("Definition", () => {
  let definition: Definition;

  beforeAll(async () => {
    definition = parseDefinition(await loadEntityFile(definitionFile));
  });

  it("loads a concrete definition from the repository", () => {
    expect(definition).toEqual({
      id: "algebra.ring.commutative-unital.definition",
      kind: "definition",
      title: "Definition of commutative unital ring",
      definition_role: "primary",
      definition_style: "formal",
      defines: [
        "algebra.ring.commutative-unital",
      ],
      equivalent_to: [],
      depends_on: [
        "algebra.ring.associative-unital",
      ],
      statement:
        "A commutative unital ring is a ring with a multiplicative identity whose multiplication is commutative.",
      display_math: [
        {
          latex: "(R,+,\\cdot,0,1_R)",
          description:
            "The underlying ring structure with distinguished additive and multiplicative identities.",
        },
        {
          latex: "\\forall a,b \\in R,\\; ab = ba",
          description: "Multiplication is commutative.",
        },
      ],
      source_refs: [
        {
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
          note:
            "Standard abstract algebra treatment of commutative rings with identity.",
        },
      ],
    });
  });

  it("represents a valid Definition", () => {
    expect(DefinitionSchema.safeParse(definition).success).toBe(true);
    expect(isDefinition(definition)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseDefinition(definition)).toEqual(definition);
  });

  it("rejects an empty defines list", () => {
    const result = DefinitionSchema.safeParse({
      ...definition,
      defines: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty statement", () => {
    const result = DefinitionSchema.safeParse({
      ...definition,
      statement: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty display math", () => {
    const result = DefinitionSchema.safeParse({
      ...definition,
      display_math: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate defined concepts", () => {
    const [conceptId] = definition.defines;

    if (conceptId === undefined) {
      throw new Error("Repository definition defines no concept");
    }

    const result = DefinitionSchema.safeParse({
      ...definition,
      defines: [
        conceptId,
        conceptId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate dependencies", () => {
    const [dependencyId] = definition.depends_on;

    if (dependencyId === undefined) {
      throw new Error("Repository definition has no dependency");
    }

    const result = DefinitionSchema.safeParse({
      ...definition,
      depends_on: [
        dependencyId,
        dependencyId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate equivalent definitions", () => {
    const result = DefinitionSchema.safeParse({
      ...definition,
      equivalent_to: [
        "algebra.ring.commutative-unital.definition.graph",
        "algebra.ring.commutative-unital.definition.graph",
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate source references", () => {
    const [sourceId] = definition.source_refs;

    if (sourceId === undefined) {
      throw new Error("Repository definition has no source reference");
    }

    const result = DefinitionSchema.safeParse({
      ...definition,
      source_refs: [
        sourceId,
        sourceId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = DefinitionSchema.safeParse({
      ...definition,
      informal: true,
    });

    expect(result.success).toBe(false);
  });
});
