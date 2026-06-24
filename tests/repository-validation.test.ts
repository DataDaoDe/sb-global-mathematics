import { describe, expect, it } from "vitest";
import { join } from "node:path";

import {
  expectedEntityPath,
  loadRepositoryEntities,
  mathematicsPath,
  parseEntityId,
  validateEntities,
  type Concept,
  type Counterexample,
  type Definition,
  type Example,
  type HistoricalNote,
  type LoadedEntity,
  type Proof,
  type Proposition,
  type Question,
  type Source,
  type SourceReference,
} from "../src/index.js";

const testMathematicsRoot = "/test/mathematics";

const displayMath = [
  {
    latex: "x = x",
    description: "A reflexive identity used in tests.",
  },
];

const source: Source = {
  id: parseEntityId("source.test"),
  kind: "source",
  title: "Test Source",
  source_type: "book",
  author_refs: [],
  locator: "Test source locator",
};

const sourceReference: SourceReference = {
  source: parseEntityId("source.test"),
  locator: "Test locator",
  note: "Test citation note.",
};

const concept: Concept = {
  id: parseEntityId("algebra.test.concept"),
  kind: "concept",
  title: "Test concept",
  summary: "A concept used in repository validation tests.",
  display_math: displayMath,
  defined_by: [
    parseEntityId("algebra.test.concept.definition"),
  ],
  broader_concepts: [],
};

const definition: Definition = {
  id: parseEntityId("algebra.test.concept.definition"),
  kind: "definition",
  title: "Definition of test concept",
  definition_role: "primary",
  definition_style: "formal",
  defines: [
    parseEntityId("algebra.test.concept"),
  ],
  equivalent_to: [],
  depends_on: [],
  statement: "A test concept is a concept used in tests.",
  display_math: displayMath,
  source_refs: [
    sourceReference,
  ],
};

const example: Example = {
  id: parseEntityId("algebra.test.concept.example.instance"),
  kind: "example",
  title: "Test concept instance",
  example_of: [
    parseEntityId("algebra.test.concept"),
  ],
  description: "A concrete instance of the test concept.",
  display_math: displayMath,
  source_refs: [
    sourceReference,
  ],
};

const counterexample: Counterexample = {
  id: parseEntityId("algebra.test.concept.counterexample.non-instance"),
  kind: "counterexample",
  title: "Non-instance of the test concept",
  counterexample_to: [
    parseEntityId("algebra.test.concept"),
  ],
  demonstrates_necessity_of: [
    parseEntityId("algebra.test.concept.definition"),
  ],
  description: "A concrete non-instance of the test concept.",
  display_math: displayMath,
  source_refs: [
    sourceReference,
  ],
};

const proposition: Proposition = {
  id: parseEntityId("algebra.test.concept.proposition.basic-claim"),
  kind: "proposition",
  title: "Basic test claim",
  proposition_type: "proposition",
  claim: "Every test concept is a test concept.",
  display_math: displayMath,
  depends_on: [
    parseEntityId("algebra.test.concept.definition"),
  ],
  source_refs: [
    sourceReference,
  ],
};

const proof: Proof = {
  id: parseEntityId(
    "algebra.test.concept.proposition.basic-claim.proof.direct",
  ),
  kind: "proof",
  title: "Direct proof of the basic test claim",
  proves: [
    parseEntityId("algebra.test.concept.proposition.basic-claim"),
  ],
  method: "direct proof",
  argument: "The claim follows directly from the definition.",
  display_math: displayMath,
  depends_on: [
    parseEntityId("algebra.test.concept.proposition.basic-claim"),
    parseEntityId("algebra.test.concept.definition"),
  ],
  source_refs: [
    sourceReference,
  ],
};

const question: Question = {
  id: parseEntityId("algebra.test.question"),
  kind: "question",
  title: "What motivates the test concept?",
  asks: "Which question motivates this test concept?",
  display_math: displayMath,
  motivates: [
    parseEntityId("algebra.test.concept"),
  ],
  related_concepts: [
    parseEntityId("algebra.test.concept"),
  ],
  prerequisite_questions: [],
  successor_questions: [],
  source_refs: [
    sourceReference,
  ],
};

const historicalNote: HistoricalNote = {
  id: parseEntityId("algebra.test.concept.history.origin"),
  kind: "historical_note",
  title: "Historical development of the test concept",
  date_label: "Test era",
  event_type: "origin",
  start_year: 1900,
  description: "A historical note for the test concept.",
  summary: "A concise historical development claim for the test concept.",
  conceptual_change:
    "The test concept became explicit enough to be represented in the repository.",
  enabled_developments: [],
  display_math: displayMath,
  subjects: [
    parseEntityId("algebra.test.concept"),
  ],
  developed_from: [
    parseEntityId("algebra.test.concept.example.instance"),
  ],
  developed_into: [],
  source_refs: [
    sourceReference,
  ],
};

describe("repository validation", () => {
  it("accepts the concrete repository graph", async () => {
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const result = validateEntities(loadedEntities);

    expect(result).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("rejects duplicate entity IDs", () => {
    const result = validateEntities([
      loaded(concept, "concept-a.yaml"),
      loaded({
        ...concept,
        title: "Duplicate test concept",
      }, "concept-b.yaml"),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    const duplicateIssues = result.issues.filter(
      (issue) => issue.code === "duplicate-id",
    );

    expect(result.valid).toBe(false);
    expect(duplicateIssues).toEqual([
      expect.objectContaining({
        code: "duplicate-id",
        entityId: "algebra.test.concept",
        targetId: "algebra.test.concept",
        path: ["id"],
      }),
    ]);
  });

  it("rejects entities at unexpected paths", () => {
    const result = validateEntities([
      loaded(concept, "wrong/concept.yaml"),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "unexpected-entity-path",
        entityId: "algebra.test.concept",
        targetId: "algebra.test.concept",
        path: ["id"],
      }),
    ]);
  });

  it("rejects display math that KaTeX cannot render", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        display_math: [
          {
            latex: "\\frac{1}",
            description: "A malformed fraction missing an argument.",
          },
        ],
      }),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    const displayMathIssues = result.issues.filter(
      (issue) => issue.code === "invalid-display-math",
    );

    expect(result.valid).toBe(false);
    expect(displayMathIssues).toEqual([
      expect.objectContaining({
        code: "invalid-display-math",
        entityId: "algebra.test.concept",
        path: ["display_math", "0", "latex"],
      }),
    ]);
  });

  it("accepts valid inline and block math inside text fields", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        summary:
          "Let $f(x)=x^2$. The block expression $$f'(x)=2x$$ is also renderable.",
      }),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded(historicalNote),
      loaded(source),
    ], testMathematicsRoot);

    expect(result).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("rejects inline math inside text fields that KaTeX cannot render", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        summary: "Let $\\frac{1}$ be malformed inline math.",
      }),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    const textMathIssues = result.issues.filter(
      (issue) => issue.code === "invalid-text-math",
    );

    expect(result.valid).toBe(false);
    expect(textMathIssues).toEqual([
      expect.objectContaining({
        code: "invalid-text-math",
        entityId: "algebra.test.concept",
        path: ["summary"],
      }),
    ]);
  });

  it("rejects inline math inside display math descriptions that KaTeX cannot render", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        display_math: [
          {
            latex: "x^2",
            description: "This caption contains malformed math $\\frac{1}$.",
          },
        ],
      }),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    const textMathIssues = result.issues.filter(
      (issue) => issue.code === "invalid-text-math",
    );

    expect(result.valid).toBe(false);
    expect(textMathIssues).toEqual([
      expect.objectContaining({
        code: "invalid-text-math",
        entityId: "algebra.test.concept",
        path: ["display_math.0.description"],
      }),
    ]);
  });

  it("rejects unclosed math delimiters inside text fields", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        summary: "Let $f(x)=x^2 be unclosed inline math.",
      }),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    const textMathIssues = result.issues.filter(
      (issue) => issue.code === "invalid-text-math",
    );

    expect(result.valid).toBe(false);
    expect(textMathIssues).toEqual([
      expect.objectContaining({
        code: "invalid-text-math",
        entityId: "algebra.test.concept",
        path: ["summary"],
      }),
    ]);
  });

  it("rejects unresolved references", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        broader_concepts: [
          parseEntityId("algebra.test.missing"),
        ],
      }),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "unresolved-reference",
        entityId: "algebra.test.concept",
        targetId: "algebra.test.missing",
        path: ["broader_concepts"],
      }),
    ]);
  });

  it("rejects references to the wrong entity kind", () => {
    const result = validateEntities([
      loaded({
        ...concept,
        defined_by: [
          parseEntityId("source.test"),
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "wrong-reference-kind",
        entityId: "algebra.test.concept",
        targetId: "source.test",
        path: ["defined_by"],
      }),
    ]);
  });

  it("rejects concept-definition inconsistency", () => {
    const result = validateEntities([
      loaded(concept),
      loaded({
        ...definition,
        defines: [
          parseEntityId("algebra.test.other-concept"),
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "unresolved-reference",
        entityId: "algebra.test.concept.definition",
        targetId: "algebra.test.other-concept",
        path: ["defines"],
      }),
      expect.objectContaining({
        code: "inconsistent-concept-definition",
        entityId: "algebra.test.concept",
        targetId: "algebra.test.concept.definition",
        path: ["defined_by"],
      }),
    ]);
  });

  it("accepts question motivation and source references", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(proposition),
      loaded(proof),
      loaded(example),
      loaded(counterexample),
      loaded(question),
      loaded(historicalNote),
      loaded(source),
    ], testMathematicsRoot);

    expect(result).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("rejects a concept with no primary definition", () => {
    const result = validateEntities([
      loaded(concept),
      loaded({
        ...definition,
        definition_role: "equivalent",
      }),
      loaded(example),
      loaded(question),
      loaded(historicalNote),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "invalid-definition-set",
        entityId: "algebra.test.concept",
        targetId: "algebra.test.concept",
        path: ["defined_by"],
      }),
    ]);
  });

  it("rejects a concept with multiple primary definitions", () => {
    const secondDefinition: Definition = {
      ...definition,
      id: parseEntityId("algebra.test.concept.definition.alternative"),
      title: "Alternative definition of test concept",
    };

    const result = validateEntities([
      loaded({
        ...concept,
        defined_by: [
          definition.id,
          secondDefinition.id,
        ],
      }),
      loaded(definition),
      loaded(secondDefinition),
      loaded(example),
      loaded(question),
      loaded(historicalNote),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "invalid-definition-set",
        entityId: "algebra.test.concept",
        targetId: "algebra.test.concept",
        path: ["defined_by"],
      }),
    ]);
  });

  it("rejects equivalent definitions that define different concepts", () => {
    const otherConcept: Concept = {
      ...concept,
      id: parseEntityId("algebra.test.other-concept"),
      title: "Other test concept",
      defined_by: [
        parseEntityId("algebra.test.other-concept.definition"),
      ],
    };
    const otherDefinition: Definition = {
      ...definition,
      id: parseEntityId("algebra.test.other-concept.definition"),
      title: "Definition of other test concept",
      defines: [
        otherConcept.id,
      ],
    };

    const result = validateEntities([
      loaded({
        ...definition,
        equivalent_to: [
          otherDefinition.id,
        ],
      }),
      loaded(concept),
      loaded(otherConcept),
      loaded(otherDefinition),
      loaded({
        ...example,
        example_of: [
          concept.id,
          otherConcept.id,
        ],
      }),
      loaded({
        ...question,
        motivates: [
          concept.id,
          otherConcept.id,
        ],
      }),
      loaded({
        ...historicalNote,
        subjects: [
          concept.id,
          otherConcept.id,
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "invalid-definition-set",
        entityId: "algebra.test.concept.definition",
        targetId: "algebra.test.other-concept.definition",
        path: ["equivalent_to"],
      }),
    ]);
  });

  it("rejects concepts without an example", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(question),
      loaded({
        ...historicalNote,
        developed_from: [],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "incomplete-entity",
        entityId: "algebra.test.concept",
        path: ["id"],
      }),
    ]);
  });

  it("rejects concepts without historical context", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "incomplete-entity",
        entityId: "algebra.test.concept",
        path: ["id"],
      }),
    ]);
  });

  it("rejects source-backed entity kinds without source references", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded({
        ...historicalNote,
        source_refs: [],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "incomplete-entity",
        entityId: "algebra.test.concept.history.origin",
        path: ["source_refs"],
      }),
    ]);
  });

  it("rejects source references without locators", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded({
        ...historicalNote,
        source_refs: [
          {
            source: parseEntityId("source.test"),
          },
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "incomplete-entity",
        entityId: "algebra.test.concept.history.origin",
        path: ["source_refs", "0", "locator"],
      }),
    ]);
  });

  it("rejects example references to the wrong entity kind", () => {
    const result = validateEntities([
      loaded({
        ...example,
        example_of: [
          parseEntityId("source.test"),
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "wrong-reference-kind",
        entityId: "algebra.test.concept.example.instance",
        targetId: "source.test",
        path: ["example_of"],
      }),
    ]);
  });

  it("rejects counterexample references to the wrong entity kind", () => {
    const result = validateEntities([
      loaded({
        ...counterexample,
        counterexample_to: [
          parseEntityId("source.test"),
        ],
      }),
      loaded(concept),
      loaded(definition),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "wrong-reference-kind",
        entityId: "algebra.test.concept.counterexample.non-instance",
        targetId: "source.test",
        path: ["counterexample_to"],
      }),
    ]);
  });

  it("rejects proposition dependencies on non-mathematical entities", () => {
    const result = validateEntities([
      loaded({
        ...proposition,
        depends_on: [
          parseEntityId("source.test"),
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "wrong-reference-kind",
        entityId: "algebra.test.concept.proposition.basic-claim",
        targetId: "source.test",
        path: ["depends_on"],
      }),
    ]);
  });

  it("rejects proof targets that are not propositions", () => {
    const result = validateEntities([
      loaded({
        ...proof,
        proves: [
          parseEntityId("algebra.test.concept"),
        ],
      }),
      loaded(concept),
      loaded(definition),
      loaded(proposition),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "wrong-reference-kind",
        entityId:
          "algebra.test.concept.proposition.basic-claim.proof.direct",
        targetId: "algebra.test.concept",
        path: ["proves"],
      }),
    ]);
  });

  it("rejects propositions without proofs", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded(historicalNote),
      loaded(proposition),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "incomplete-entity",
        entityId: "algebra.test.concept.proposition.basic-claim",
        path: ["id"],
      }),
    ]);
  });

  it("rejects proofs that do not depend on the propositions they prove", () => {
    const result = validateEntities([
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded(historicalNote),
      loaded(proposition),
      loaded({
        ...proof,
        depends_on: [
          parseEntityId("algebra.test.concept.definition"),
        ],
      }),
      loaded(source),
    ], testMathematicsRoot);

    const proofIssues = result.issues.filter((issue) =>
      issue.code === "inconsistent-proof"
    );

    expect(result.valid).toBe(false);
    expect(proofIssues).toEqual([
      expect.objectContaining({
        code: "inconsistent-proof",
        entityId:
          "algebra.test.concept.proposition.basic-claim.proof.direct",
        targetId: "algebra.test.concept.proposition.basic-claim",
        path: ["depends_on"],
      }),
    ]);
  });

  it("rejects counterexamples that do not state what necessity they demonstrate", () => {
    const result = validateEntities([
      loaded({
        ...counterexample,
        demonstrates_necessity_of: [],
      }),
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(question),
      loaded(historicalNote),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "incomplete-entity",
        entityId: "algebra.test.concept.counterexample.non-instance",
        path: ["demonstrates_necessity_of"],
      }),
    ]);
  });

  it("rejects non-reciprocal successor question links", () => {
    const successorQuestion: Question = {
      ...question,
      id: parseEntityId("algebra.test.successor-question"),
      title: "What follows from the test concept?",
      motivates: [],
      related_concepts: [
        concept.id,
      ],
    };

    const result = validateEntities([
      loaded({
        ...question,
        successor_questions: [
          successorQuestion.id,
        ],
      }),
      loaded(successorQuestion),
      loaded(concept),
      loaded(definition),
      loaded(example),
      loaded(historicalNote),
      loaded(source),
    ], testMathematicsRoot);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "inconsistent-question-progression",
        entityId: "algebra.test.question",
        targetId: "algebra.test.successor-question",
        path: ["successor_questions"],
      }),
    ]);
  });
});

function loaded(
  entity: LoadedEntity["entity"],
  filePath = expectedEntityPath(entity, testMathematicsRoot),
): LoadedEntity {
  return {
    entity,
    filePath: filePath.startsWith("/")
      ? filePath
      : join(testMathematicsRoot, filePath),
  };
}
