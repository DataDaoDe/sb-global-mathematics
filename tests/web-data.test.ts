import { describe, expect, it } from "vitest";

import {
  buildGraph,
  buildWebData,
  loadRepositoryEntities,
  mathematicsPath,
} from "../src/index.js";

describe("web data builder", () => {
  it("builds browser-oriented entity pages and indexes", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);
    const webData = buildWebData(graph);

    expect(webData.metadata).toEqual(graph.metadata);
    expect(webData.pages).toHaveLength(graph.entities.length);
    expect(webData.index).toEqual(
      graph.entities.map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        title: entity.title,
      })),
    );
    expect(webData.search).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "algebra.ring.commutative-unital",
          title: "Commutative unital ring",
          text: expect.stringContaining("multiplicative identity"),
        }),
      ]),
    );
    expect(webData.tree.root.counts).toEqual({
      concept: 96,
      counterexample: 11,
      definition: 107,
      example: 105,
      historical_note: 26,
      person: 26,
      proof: 12,
      proposition: 12,
      question: 21,
      source: 26,
    });
    expect(webData.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: expect.objectContaining({
            id: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
            event_type: "formalization",
            start_year: 1921,
            end_year: 1930,
            conceptual_change: expect.stringContaining("Arithmetic laws"),
          }),
          subjects: [
            {
              id: "algebra.ring.commutative-unital",
              kind: "concept",
              title: "Commutative unital ring",
            },
          ],
        }),
      ]),
    );
  });

  it("builds a namespace tree from entity identifiers", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);
    const webData = buildWebData(graph);
    const algebra = webData.tree.root.children.find(
      (node) => node.path === "algebra",
    );
    const ring = algebra?.children.find((node) => node.path === "algebra.ring");
    const commutativeUnital = ring?.children.find(
      (node) => node.path === "algebra.ring.commutative-unital",
    );

    expect(algebra).toEqual(
      expect.objectContaining({
        label: "Algebra",
        counts: {
          concept: 28,
          counterexample: 4,
          definition: 28,
          example: 43,
          historical_note: 6,
          proof: 5,
          proposition: 5,
          question: 5,
        },
      }),
    );
    expect(commutativeUnital).toEqual(
      expect.objectContaining({
        label: "Commutative Unital",
        entities: [
          {
            id: "algebra.ring.commutative-unital",
            kind: "concept",
            title: "Commutative unital ring",
          },
        ],
      }),
    );
    expect(commutativeUnital?.children.map((node) => node.path)).toEqual([
      "algebra.ring.commutative-unital.counterexample",
      "algebra.ring.commutative-unital.definition",
      "algebra.ring.commutative-unital.example",
      "algebra.ring.commutative-unital.history",
      "algebra.ring.commutative-unital.proposition",
      "algebra.ring.commutative-unital.question",
    ]);
  });

  it("groups related entities for a concept page", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);
    const webData = buildWebData(graph);
    const page = webData.pages.find(
      (candidate) =>
        candidate.entity.id === "algebra.ring.commutative-unital",
    );

    expect(page).toBeDefined();
    expect(page?.relations).toEqual(
      expect.objectContaining({
        defined_by: [
          {
            id: "algebra.ring.commutative-unital.definition",
            kind: "definition",
            title: "Definition of commutative unital ring",
          },
        ],
        broader_concepts: [
          {
            id: "algebra.ring.associative-unital",
            kind: "concept",
            title: "Associative unital ring",
          },
        ],
        definitions: [
          {
            id: "algebra.ring.commutative-unital.definition",
            kind: "definition",
            title: "Definition of commutative unital ring",
          },
        ],
        examples: expect.arrayContaining([
          {
            id: "algebra.ring.commutative-unital.example.integers",
            kind: "example",
            title: "Integers as a commutative unital ring",
          },
          {
            id: "algebra.ring.commutative-unital.example.polynomial-ring-integers",
            kind: "example",
            title: "Integer polynomial ring as a commutative unital ring",
          },
        ]),
        counterexamples: [
          {
            id: "algebra.ring.commutative-unital.counterexample.matrix-ring-m2-real",
            kind: "counterexample",
            title: "Two-by-two real matrices are not commutative",
          },
        ],
        motivating_questions: [
          {
            id: "algebra.ring.commutative-unital.question.generalize-integer-arithmetic",
            kind: "question",
            title: "What algebraic structures generalize integer arithmetic?",
          },
        ],
        history: [
          {
            id: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
            kind: "historical_note",
            title: "Rings as an abstraction of integer-like arithmetic",
          },
        ],
      }),
    );
    expect(page?.history).toEqual([
      expect.objectContaining({
        entity: expect.objectContaining({
          id: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
          date_label: "Modern abstract algebra formulation",
          event_type: "formalization",
          start_year: 1921,
          end_year: 1930,
          source_refs: expect.arrayContaining([
            expect.objectContaining({
              source: "source.noether-1921-idealtheorie",
              locator: "Mathematische Annalen 83",
            }),
            expect.objectContaining({
              source: "source.dummit-foote-abstract-algebra-third-edition",
              locator: "Chapter 7",
              note: "Secondary source for the modern abstract algebra formulation.",
            }),
          ]),
          conceptual_change: expect.stringContaining("Arithmetic laws"),
        }),
        developed_from: [
          {
            id: "algebra.ring.commutative-unital.example.integers",
            kind: "example",
            title: "Integers as a commutative unital ring",
          },
        ],
        developed_into: [],
      }),
    ]);
  });

  it("records source backlinks with locators for source pages", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);
    const webData = buildWebData(graph);
    const page = webData.pages.find(
      (candidate) =>
        candidate.entity.id ===
          "source.dummit-foote-abstract-algebra-third-edition",
    );

    expect(page).toBeDefined();
    expect(page?.citation_backlinks).toEqual(
      expect.arrayContaining([
        {
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
          note: "Standard abstract algebra treatment of commutative rings with identity.",
          entity: {
            id: "algebra.ring.commutative-unital.definition",
            kind: "definition",
            title: "Definition of commutative unital ring",
          },
        },
        {
          source: "source.dummit-foote-abstract-algebra-third-edition",
          locator: "Chapter 7",
          note: "Secondary source for the modern abstract algebra formulation.",
          entity: {
            id: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
            kind: "historical_note",
            title: "Rings as an abstraction of integer-like arithmetic",
          },
        },
      ]),
    );
  });
});
