import { beforeAll, describe, expect, it } from "vitest";

import {
  QuestionSchema,
  isQuestion,
  loadEntityFile,
  mathematicsPath,
  parseQuestion,
  type Question,
} from "../src/index.js";

const questionFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "questions",
  "generalize-integer-arithmetic.yaml",
);

describe("Question", () => {
  let question: Question;

  beforeAll(async () => {
    question = parseQuestion(await loadEntityFile(questionFile));
  });

  it("loads a concrete question from the repository", () => {
    expect(question).toEqual({
      id: "algebra.ring.commutative-unital.question.generalize-integer-arithmetic",
      kind: "question",
      title: "What algebraic structures generalize integer arithmetic?",
      asks:
        "What structures preserve the interaction between addition and multiplication found in the integers while allowing more general mathematical objects?",
      display_math: [
        {
          latex:
            "(\\mathbb{Z}, +, \\cdot) \\leadsto (R, +, \\cdot)",
          description:
            "Generalizing integer arithmetic to ring-like structures.",
        },
      ],
      motivates: [
        "algebra.ring.commutative-unital",
      ],
      related_concepts: [
        "algebra.ring.commutative-unital",
        "algebra.ring.associative-unital",
      ],
      source_refs: [
        "source.dummit-foote-abstract-algebra-third-edition",
      ],
    });
  });

  it("represents a valid Question", () => {
    expect(QuestionSchema.safeParse(question).success).toBe(true);
    expect(isQuestion(question)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseQuestion(question)).toEqual(question);
  });

  it("rejects an empty question", () => {
    const result = QuestionSchema.safeParse({
      ...question,
      asks: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty display math", () => {
    const result = QuestionSchema.safeParse({
      ...question,
      display_math: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate motivated entities", () => {
    const [motivatedId] = question.motivates;

    if (motivatedId === undefined) {
      throw new Error("Repository question motivates no entity");
    }

    const result = QuestionSchema.safeParse({
      ...question,
      motivates: [
        motivatedId,
        motivatedId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate related concepts", () => {
    const [conceptId] = question.related_concepts;

    if (conceptId === undefined) {
      throw new Error("Repository question has no related concept");
    }

    const result = QuestionSchema.safeParse({
      ...question,
      related_concepts: [
        conceptId,
        conceptId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate source references", () => {
    const [sourceId] = question.source_refs;

    if (sourceId === undefined) {
      throw new Error("Repository question has no source reference");
    }

    const result = QuestionSchema.safeParse({
      ...question,
      source_refs: [
        sourceId,
        sourceId,
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = QuestionSchema.safeParse({
      ...question,
      exercise_prompt: "Compute an example.",
    });

    expect(result.success).toBe(false);
  });
});
