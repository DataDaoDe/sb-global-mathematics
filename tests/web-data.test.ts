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
      concept: 38,
      counterexample: 8,
      definition: 39,
      example: 37,
      historical_note: 8,
      proof: 4,
      proposition: 4,
      question: 7,
      source: 1,
    });
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
          concept: 27,
          counterexample: 4,
          definition: 27,
          example: 26,
          historical_note: 6,
          proof: 4,
          proposition: 4,
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
        examples: [
          {
            id: "algebra.ring.commutative-unital.example.integers",
            kind: "example",
            title: "Integers as a commutative unital ring",
          },
        ],
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
          source_refs: [
            {
              source: "source.dummit-foote-abstract-algebra-third-edition",
              locator: "Chapter 7",
              note: "Secondary source for the modern abstract algebra formulation.",
            },
          ],
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
