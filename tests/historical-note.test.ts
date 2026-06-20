import { beforeAll, describe, expect, it } from "vitest";

import {
  HistoricalNoteSchema,
  isHistoricalNote,
  loadEntityFile,
  mathematicsPath,
  parseHistoricalNote,
  type HistoricalNote,
} from "../src/index.js";

const historicalNoteFile = mathematicsPath(
  "algebra",
  "ring",
  "commutative-unital",
  "history",
  "integer-arithmetic-abstraction.yaml",
);

describe("HistoricalNote", () => {
  let historicalNote: HistoricalNote;

  beforeAll(async () => {
    historicalNote = parseHistoricalNote(
      await loadEntityFile(historicalNoteFile),
    );
  });

  it("loads a concrete historical note from the repository", () => {
    expect(historicalNote).toEqual({
      id: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
      kind: "historical_note",
      title: "Rings as an abstraction of integer-like arithmetic",
      date_label: "Modern abstract algebra formulation",
      description:
        "The modern concept of a commutative unital ring isolates the formal interaction between addition and multiplication familiar from the integers. This viewpoint treats arithmetic laws such as commutativity, associativity, distributivity, and the existence of additive and multiplicative identities as reusable structure rather than as properties of one number system.",
      display_math: [
        {
          latex:
            "(\\mathbb{Z}, +, \\cdot)\n\\rightsquigarrow\n(R, +, \\cdot)",
          description:
            "The passage from integer arithmetic to an abstract ring structure.",
        },
      ],
      subjects: [
        "algebra.ring.commutative-unital",
      ],
      developed_from: [
        "algebra.ring.commutative-unital.example.integers",
      ],
      developed_into: [],
      source_refs: [
        {
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
          note: "Secondary source for the modern abstract algebra formulation.",
        },
      ],
    });
  });

  it("represents a valid HistoricalNote", () => {
    expect(HistoricalNoteSchema.safeParse(historicalNote).success).toBe(true);
    expect(isHistoricalNote(historicalNote)).toBe(true);
  });

  it("rejects an empty date label", () => {
    const result = HistoricalNoteSchema.safeParse({
      ...historicalNote,
      date_label: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects notes without subjects", () => {
    const result = HistoricalNoteSchema.safeParse({
      ...historicalNote,
      subjects: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate subjects", () => {
    const [subjectId] = historicalNote.subjects;

    if (subjectId === undefined) {
      throw new Error("Repository historical note has no subject");
    }

    const result = HistoricalNoteSchema.safeParse({
      ...historicalNote,
      subjects: [
        subjectId,
        subjectId,
      ],
    });

    expect(result.success).toBe(false);
  });
});
