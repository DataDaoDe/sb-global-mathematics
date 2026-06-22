import { describe, expect, it } from "vitest";

import {
  buildGraph,
  loadRepositoryEntities,
  mathematicsPath,
} from "../src/index.js";

describe("graph builder", () => {
  it("builds deterministic entities and edges from repository content", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);

    expect(graph.metadata).toEqual({
      schema_version: 1,
      generated_at: expect.any(String),
      entity_count: graph.entities.length,
      edge_count: graph.edges.length,
    });

    expect(graph.entities.map((entity) => entity.id)).toEqual(
      [...graph.entities.map((entity) => entity.id)].sort(),
    );

    expect(graph.edges).toEqual(
      [...graph.edges].sort((left, right) =>
        left.from.localeCompare(right.from) ||
        left.relation.localeCompare(right.relation) ||
        left.to.localeCompare(right.to)
      ),
    );
  });

  it("includes canonical edges for definitions, examples, counterexamples, proofs, questions, history, and sources", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        {
          from: "algebra.ring.commutative-unital",
          relation: "defined_by",
          to: "algebra.ring.commutative-unital.definition",
        },
        {
          from: "algebra.ring.commutative-unital.definition",
          relation: "defines",
          to: "algebra.ring.commutative-unital",
        },
        {
          from: "algebra.ring.commutative-unital.example.integers",
          relation: "example_of",
          to: "algebra.ring.commutative-unital",
        },
        {
          from: "algebra.ring.commutative-unital.counterexample.matrix-ring-m2-real",
          relation: "counterexample_to",
          to: "algebra.ring.commutative-unital",
        },
        {
          from: "algebra.ring.commutative-unital.proposition.specializes-associative-unital.proof.direct-from-definition",
          relation: "proves",
          to: "algebra.ring.commutative-unital.proposition.specializes-associative-unital",
        },
        {
          from: "algebra.ring.commutative-unital.question.generalize-integer-arithmetic",
          relation: "motivates",
          to: "algebra.ring.commutative-unital",
        },
        {
          from: "foundations.mathematical-logic.question.represent-validity-symbolically",
          relation: "prerequisite_question",
          to: "foundations.mathematical-logic.question.what-makes-argument-valid",
        },
        {
          from: "foundations.mathematical-logic.question.what-makes-argument-valid",
          relation: "successor_question",
          to: "foundations.mathematical-logic.question.represent-validity-symbolically",
        },
        {
          from: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
          relation: "historical_context_for",
          to: "algebra.ring.commutative-unital",
        },
        {
          from: "algebra.ring.commutative-unital.history.integer-arithmetic-abstraction",
          relation: "developed_from",
          to: "algebra.ring.commutative-unital.example.integers",
        },
        {
          from: "algebra.ring.commutative-unital.proposition.specializes-associative-unital",
          relation: "source_ref",
          to: "source.dummit-foote-abstract-algebra-third-edition",
        },
      ]),
    );
  });
});
