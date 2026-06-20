import { beforeAll, describe, expect, it } from "vitest";

import {
  ExampleSchema,
  isExample,
  loadEntityFile,
  mathematicsPath,
  parseExample,
  type Example,
} from "../src/index.js";

const exampleFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "examples",
  "integers.yaml",
);

describe("Example", () => {
  let example: Example;

  beforeAll(async () => {
    example = parseExample(await loadEntityFile(exampleFile));
  });

  it("loads a concrete example from the repository", () => {
    expect(example).toEqual({
      id: "algebra.ring.commutative-unital.example.integers",
      kind: "example",
      title: "Integers as a commutative unital ring",
      example_of: [
        "algebra.ring.commutative-unital",
      ],
      description:
        "The integers form a commutative unital ring under ordinary addition and multiplication. The multiplicative identity is 1.",
      display_math: [
        {
          latex: "(\\mathbb{Z}, +, \\cdot, 0, 1)",
          description:
            "The integers with ordinary addition and multiplication.",
        },
        {
          latex: "\\forall a,b \\in \\mathbb{Z},\\; ab = ba",
          description: "Integer multiplication is commutative.",
        },
      ],
      source_refs: [
        "source.dummit-foote-abstract-algebra-third-edition",
      ],
    });
  });

  it("represents a valid Example", () => {
    expect(ExampleSchema.safeParse(example).success).toBe(true);
    expect(isExample(example)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseExample(example)).toEqual(example);
  });

  it("rejects an empty example target list", () => {
    const result = ExampleSchema.safeParse({
      ...example,
      example_of: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty description", () => {
    const result = ExampleSchema.safeParse({
      ...example,
      description: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty display math", () => {
    const result = ExampleSchema.safeParse({
      ...example,
      display_math: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate example targets", () => {
    const [targetId] = example.example_of;

    if (targetId === undefined) {
      throw new Error("Repository example has no target");
    }

    const result = ExampleSchema.safeParse({
      ...example,
      example_of: [
        targetId,
        targetId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate source references", () => {
    const [sourceId] = example.source_refs;

    if (sourceId === undefined) {
      throw new Error("Repository example has no source reference");
    }

    const result = ExampleSchema.safeParse({
      ...example,
      source_refs: [
        sourceId,
        sourceId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = ExampleSchema.safeParse({
      ...example,
      worked_solution: "not part of this repository",
    });

    expect(result.success).toBe(false);
  });
});
