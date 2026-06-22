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
    expect(historicalNote).toEqual(expect.objectContaining({
      id: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
      kind: "historical_note",
      title: "Rings as an abstraction of integer-like arithmetic",
      date_label: "Modern abstract algebra formulation",
      event_type: "formalization",
      start_year: 1921,
      end_year: 1930,
      description: expect.stringContaining("commutative unital ring"),
      summary:
        "Commutative unital rings abstracted integer-like arithmetic into reusable algebraic structure.",
      prior_formulation:
        "Addition and multiplication were first encountered through concrete number systems such as the integers.",
      conceptual_change:
        "Arithmetic laws were separated from the integers and treated as axioms for a general class of algebraic systems.",
      resulting_formulation:
        "A commutative unital ring is a set with two operations satisfying additive, multiplicative, distributive, commutative, and identity laws.",
      enabled_developments: [
        "Ideal theory became a structural way to study arithmetic inside rings.",
        "Commutative algebra could treat number-theoretic and geometric examples uniformly.",
      ],
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
      source_refs: expect.arrayContaining([
        expect.objectContaining({
          source: "source.noether-1921-idealtheorie",
          locator: "Mathematische Annalen 83",
        }),
        expect.objectContaining({
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
        }),
      ]),
    }));
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

  it("rejects an empty conceptual change", () => {
    const result = HistoricalNoteSchema.safeParse({
      ...historicalNote,
      conceptual_change: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects historical ranges whose end year is earlier than their start year", () => {
    const result = HistoricalNoteSchema.safeParse({
      ...historicalNote,
      start_year: 1930,
      end_year: 1921,
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
