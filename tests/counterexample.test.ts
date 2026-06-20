import { beforeAll, describe, expect, it } from "vitest";

import {
  CounterexampleSchema,
  isCounterexample,
  loadEntityFile,
  mathematicsPath,
  parseCounterexample,
  type Counterexample,
} from "../src/index.js";

const counterexampleFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "counterexamples",
  "matrix-ring-m2-real.yaml",
);

describe("Counterexample", () => {
  let counterexample: Counterexample;

  beforeAll(async () => {
    counterexample = parseCounterexample(
      await loadEntityFile(counterexampleFile),
    );
  });

  it("loads a concrete counterexample from the repository", () => {
    expect(counterexample).toEqual({
      id: "algebra.ring.commutative-unital.counterexample.matrix-ring-m2-real",
      kind: "counterexample",
      title: "Two-by-two real matrices are not commutative",
      counterexample_to: [
        "algebra.ring.commutative-unital",
      ],
      demonstrates_necessity_of: [
        "algebra.ring.associative-unital",
      ],
      description:
        "The ring of two-by-two real matrices has a multiplicative identity and associative multiplication, but matrix multiplication is not commutative. Therefore it is not a commutative unital ring.",
      display_math: [
        {
          latex: "M_2(\\mathbb{R})",
          description: "The ring of two-by-two real matrices.",
        },
        {
          latex:
            "\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}\\begin{pmatrix}0&0\\\\1&0\\end{pmatrix} \\ne \\begin{pmatrix}0&0\\\\1&0\\end{pmatrix}\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}",
          description: "A concrete failure of commutativity.",
        },
      ],
      source_refs: [
        {
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
          note:
            "Matrix rings provide standard noncommutative ring examples.",
        },
      ],
    });
  });

  it("represents a valid Counterexample", () => {
    expect(CounterexampleSchema.safeParse(counterexample).success)
      .toBe(true);
    expect(isCounterexample(counterexample)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseCounterexample(counterexample)).toEqual(
      counterexample,
    );
  });

  it("rejects an empty counterexample target list", () => {
    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      counterexample_to: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty description", () => {
    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      description: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty display math", () => {
    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      display_math: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate counterexample targets", () => {
    const [targetId] = counterexample.counterexample_to;

    if (targetId === undefined) {
      throw new Error("Repository counterexample has no target");
    }

    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      counterexample_to: [
        targetId,
        targetId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate necessity targets", () => {
    const [targetId] = counterexample.demonstrates_necessity_of;

    if (targetId === undefined) {
      throw new Error(
        "Repository counterexample has no necessity target",
      );
    }

    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      demonstrates_necessity_of: [
        targetId,
        targetId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate source references", () => {
    const [sourceId] = counterexample.source_refs;

    if (sourceId === undefined) {
      throw new Error(
        "Repository counterexample has no source reference",
      );
    }

    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      source_refs: [
        sourceId,
        sourceId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = CounterexampleSchema.safeParse({
      ...counterexample,
      exercise_prompt: "not part of this repository",
    });

    expect(result.success).toBe(false);
  });
});
