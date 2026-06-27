import { basename } from "node:path";

import katex from "katex";

import {
  type MathematicalEntity,
  type SupportedEntityKind,
} from "../domain/mathematical-entity.js";
import { discoverEntityFiles } from "./discover-entity-files.js";
import {
  expectedEntityPath,
  relativeEntityPath,
} from "./entity-path.js";
import { loadEntityFile } from "./load-entity-file.js";
import { MATHEMATICS_ROOT } from "./paths.js";

export type LoadedEntity = {
  readonly entity: MathematicalEntity;
  readonly filePath: string;
};

export type RepositoryValidationIssueCode =
  | "duplicate-id"
  | "unresolved-reference"
  | "wrong-reference-kind"
  | "inconsistent-concept-definition"
  | "inconsistent-proof"
  | "inconsistent-question-progression"
  | "invalid-definition-set"
  | "incomplete-entity"
  | "unexpected-entity-path"
  | "invalid-display-math"
  | "invalid-text-math";

export type RepositoryValidationIssue = {
  readonly code: RepositoryValidationIssueCode;
  readonly message: string;
  readonly entityId: string;
  readonly filePath: string;
  readonly path: readonly string[];
  readonly targetId?: string;
};

export type RepositoryValidationResult = {
  readonly valid: boolean;
  readonly issues: readonly RepositoryValidationIssue[];
};

type ReferenceRule = {
  readonly path: readonly string[];
  readonly targetKinds: readonly SupportedEntityKind[];
};

const MATHEMATICAL_ENTITY_KINDS = [
  "concept",
  "definition",
  "proposition",
  "proof",
  "example",
  "counterexample",
  "historical_note",
] as const satisfies readonly SupportedEntityKind[];

function isMathematicalEntityKind(
  kind: SupportedEntityKind,
): kind is typeof MATHEMATICAL_ENTITY_KINDS[number] {
  return (MATHEMATICAL_ENTITY_KINDS as readonly SupportedEntityKind[])
    .includes(kind);
}

export async function loadRepositoryEntities(
  rootPath = MATHEMATICS_ROOT,
): Promise<LoadedEntity[]> {
  const entityFiles = await discoverEntityFiles(rootPath);

  return Promise.all(
    entityFiles.map(async (filePath) => ({
      entity: await loadEntityFile(filePath),
      filePath,
    })),
  );
}

export async function validateRepository(
  rootPath = MATHEMATICS_ROOT,
): Promise<RepositoryValidationResult> {
  const loadedEntities = await loadRepositoryEntities(rootPath);

  return validateEntities(loadedEntities, rootPath);
}

export function validateEntities(
  loadedEntities: readonly LoadedEntity[],
  mathematicsRoot = MATHEMATICS_ROOT,
): RepositoryValidationResult {
  const issues: RepositoryValidationIssue[] = [];
  const entitiesById = new Map<string, LoadedEntity>();

  for (const loadedEntity of loadedEntities) {
    validateEntityPath(loadedEntity, mathematicsRoot, issues);
    validateDisplayMath(loadedEntity, issues);
    validateTextMath(loadedEntity, issues);

    const existingEntity = entitiesById.get(loadedEntity.entity.id);

    if (existingEntity !== undefined) {
      issues.push({
        code: "duplicate-id",
        message:
          `Duplicate entity ID "${loadedEntity.entity.id}" appears in ${basename(existingEntity.filePath)} and ${basename(loadedEntity.filePath)}`,
        entityId: loadedEntity.entity.id,
        filePath: loadedEntity.filePath,
        path: ["id"],
        targetId: loadedEntity.entity.id,
      });
    }

    entitiesById.set(loadedEntity.entity.id, loadedEntity);
  }

  for (const loadedEntity of loadedEntities) {
    validateReferences(loadedEntity, entitiesById, issues);
  }

  validateConceptDefinitionConsistency(loadedEntities, entitiesById, issues);

  if (issues.length === 0) {
    validateDefinitionSetConsistency(loadedEntities, entitiesById, issues);
    validateEquivalentDefinitionConsistency(loadedEntities, entitiesById, issues);
  }

  if (issues.length === 0) {
    validateCompleteness(loadedEntities, issues);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function validateCompleteness(
  loadedEntities: readonly LoadedEntity[],
  issues: RepositoryValidationIssue[],
): void {
  const entities = loadedEntities.map((loadedEntity) => loadedEntity.entity);

  for (const loadedEntity of loadedEntities) {
    const { entity } = loadedEntity;

    switch (entity.kind) {
      case "concept":
        validateConceptCompleteness(loadedEntity, entities, issues);
        break;

      case "definition":
      case "example":
      case "historical_note":
        validateSourceBackedEntity(loadedEntity, issues);
        break;

      case "proposition":
        validateSourceBackedEntity(loadedEntity, issues);
        validatePropositionCompleteness(loadedEntity, entities, issues);
        break;

      case "proof":
        validateSourceBackedEntity(loadedEntity, issues);
        validateProofCompleteness(loadedEntity, issues);
        break;

      case "counterexample":
        validateSourceBackedEntity(loadedEntity, issues);
        validateCounterexampleCompleteness(loadedEntity, issues);
        break;

      case "question":
        validateSourceBackedEntity(loadedEntity, issues);
        validateQuestionProgressionConsistency(loadedEntity, entities, issues);
        break;

      case "source":
        validateSourceCompleteness(loadedEntity, issues);
        break;

      case "person":
        validatePersonCompleteness(loadedEntity, issues);
        break;
    }
  }
}

function validateConceptCompleteness(
  loadedEntity: LoadedEntity,
  entities: readonly MathematicalEntity[],
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "concept") {
    return;
  }

  const hasExample = entities.some((candidate) =>
    candidate.kind === "example" && candidate.example_of.includes(entity.id)
  );
  const hasMotivatingQuestion = entities.some((candidate) =>
    candidate.kind === "question" &&
    (
      candidate.motivates.includes(entity.id) ||
      candidate.related_concepts.includes(entity.id)
    )
  );
  const hasHistoricalContext = entities.some((candidate) =>
    candidate.kind === "historical_note" &&
    candidate.subjects.includes(entity.id)
  );

  if (!hasExample) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["id"],
      "Concepts must have at least one example so readers can ground the idea.",
    );
  }

  if (!hasMotivatingQuestion) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["id"],
      "Concepts must be connected to at least one motivating or related question.",
    );
  }

  if (!hasHistoricalContext) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["id"],
      "Concepts must have at least one historical note so development context is not optional.",
    );
  }
}

function validatePropositionCompleteness(
  loadedEntity: LoadedEntity,
  entities: readonly MathematicalEntity[],
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "proposition") {
    return;
  }

  const hasProof = entities.some((candidate) =>
    candidate.kind === "proof" && candidate.proves.includes(entity.id)
  );

  if (!hasProof) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["id"],
      "Propositions must have at least one proof so claims are not left unsupported.",
    );
  }
}

function validateProofCompleteness(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "proof") {
    return;
  }

  const missingProvedDependencies = entity.proves.filter((propositionId) =>
    !entity.depends_on.includes(propositionId)
  );

  if (missingProvedDependencies.length > 0) {
    const [targetId] = missingProvedDependencies;

    if (targetId === undefined) {
      return;
    }

    issues.push({
      code: "inconsistent-proof",
      message:
        `Proof "${entity.id}" must list each proved proposition in depends_on: ${missingProvedDependencies.join(", ")}`,
      entityId: entity.id,
      filePath: loadedEntity.filePath,
      path: ["depends_on"],
      targetId,
    });
  }

  entity.steps.forEach((step, stepIndex) => {
    const missingTopLevelDependencies = step.depends_on.filter((dependencyId) =>
      !entity.depends_on.includes(dependencyId)
    );

    if (missingTopLevelDependencies.length === 0) {
      return;
    }

    const [targetId] = missingTopLevelDependencies;

    if (targetId === undefined) {
      return;
    }

    issues.push({
      code: "inconsistent-proof",
      message:
        `Proof "${entity.id}" uses step dependency "${targetId}" that is not listed in top-level depends_on.`,
      entityId: entity.id,
      filePath: loadedEntity.filePath,
      path: ["steps", String(stepIndex), "depends_on"],
      targetId,
    });
  });
}

function validateCounterexampleCompleteness(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "counterexample") {
    return;
  }

  if (entity.demonstrates_necessity_of.length === 0) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["demonstrates_necessity_of"],
      "Counterexamples must explain which definition, proposition, or assumption they show to be necessary.",
    );
  }
}

function validateQuestionProgressionConsistency(
  loadedEntity: LoadedEntity,
  entities: readonly MathematicalEntity[],
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "question") {
    return;
  }

  const questionsById = new Map(
    entities
      .filter((candidate) => candidate.kind === "question")
      .map((question) => [question.id, question]),
  );

  for (const successorId of entity.successor_questions) {
    const successor = questionsById.get(successorId);

    if (successor !== undefined && !successor.prerequisite_questions.includes(entity.id)) {
      questionProgressionIssue(
        loadedEntity,
        issues,
        ["successor_questions"],
        successorId,
        `Question "${entity.id}" lists "${successorId}" as a successor, but the successor does not list it as a prerequisite.`,
      );
    }
  }

  for (const prerequisiteId of entity.prerequisite_questions) {
    const prerequisite = questionsById.get(prerequisiteId);

    if (prerequisite !== undefined && !prerequisite.successor_questions.includes(entity.id)) {
      questionProgressionIssue(
        loadedEntity,
        issues,
        ["prerequisite_questions"],
        prerequisiteId,
        `Question "${entity.id}" lists "${prerequisiteId}" as a prerequisite, but the prerequisite does not list it as a successor.`,
      );
    }
  }
}

function questionProgressionIssue(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
  path: readonly string[],
  targetId: string,
  message: string,
): void {
  issues.push({
    code: "inconsistent-question-progression",
    message,
    entityId: loadedEntity.entity.id,
    filePath: loadedEntity.filePath,
    path,
    targetId,
  });
}

function validateSourceBackedEntity(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (
    "source_refs" in entity &&
    Array.isArray(entity.source_refs) &&
    entity.source_refs.length === 0
  ) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["source_refs"],
      `${entity.kind} entities must cite at least one source.`,
    );
  }

  if ("source_refs" in entity && Array.isArray(entity.source_refs)) {
    entity.source_refs.forEach((reference, index) => {
      if (reference.locator === undefined) {
        incompleteIssue(
          loadedEntity,
          issues,
          ["source_refs", String(index), "locator"],
          "Source references must include a locator.",
        );
      }
    });
  }
}

function validateSourceCompleteness(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "source") {
    return;
  }

  if (entity.author_refs.length === 0 && entity.locator === undefined) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["author_refs"],
      "Sources must provide author references or a locator.",
    );
  }
}

function validatePersonCompleteness(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "person") {
    return;
  }

  if (entity.source_refs.length === 0) {
    incompleteIssue(
      loadedEntity,
      issues,
      ["source_refs"],
      "People must cite at least one source for identity or biographical details.",
    );
  }
}

function incompleteIssue(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
  path: readonly string[],
  message: string,
): void {
  issues.push({
    code: "incomplete-entity",
    message: `Entity "${loadedEntity.entity.id}" is incomplete: ${message}`,
    entityId: loadedEntity.entity.id,
    filePath: loadedEntity.filePath,
    path,
    targetId: loadedEntity.entity.id,
  });
}

type TextMathExpression = {
  readonly latex: string;
  readonly displayMode: boolean;
  readonly start: number;
};

function validateDisplayMath(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind === "source" || entity.kind === "person") {
    return;
  }

  for (const [index, expression] of entity.display_math.entries()) {
    validateDisplayMathExpression(
      loadedEntity,
      issues,
      expression.latex,
      ["display_math", String(index), "latex"],
      `display_math.${index}`,
    );
  }

  if (entity.kind === "proof") {
    for (const [stepIndex, step] of entity.steps.entries()) {
      for (const [expressionIndex, expression] of step.display_math.entries()) {
        validateDisplayMathExpression(
          loadedEntity,
          issues,
          expression.latex,
          [
            "steps",
            String(stepIndex),
            "display_math",
            String(expressionIndex),
            "latex",
          ],
          `steps.${stepIndex}.display_math.${expressionIndex}`,
        );
      }
    }
  }
}

function validateDisplayMathExpression(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
  latex: string,
  path: readonly string[],
  label: string,
): void {
  const { entity } = loadedEntity;

    try {
      katex.renderToString(latex, {
        displayMode: true,
        throwOnError: true,
        strict: "error",
      });
    } catch (error) {
      issues.push({
        code: "invalid-display-math",
        message:
          `Entity "${entity.id}" has invalid display math at ${label}: ${errorMessage(error)}`,
        entityId: entity.id,
        filePath: loadedEntity.filePath,
        path,
        targetId: entity.id,
      });
    }
}

function validateTextMath(
  loadedEntity: LoadedEntity,
  issues: RepositoryValidationIssue[],
): void {
  for (const { fieldName, text } of textFieldsFor(loadedEntity.entity)) {
    const expressions = extractTextMath(text);

    for (const expression of expressions) {
      try {
        katex.renderToString(expression.latex, {
          displayMode: expression.displayMode,
          throwOnError: true,
          strict: "error",
        });
      } catch (error) {
        issues.push({
          code: "invalid-text-math",
          message:
            `Entity "${loadedEntity.entity.id}" has invalid ${expression.displayMode ? "block" : "inline"} math in ${fieldName}: ${errorMessage(error)}`,
          entityId: loadedEntity.entity.id,
          filePath: loadedEntity.filePath,
          path: [fieldName],
          targetId: loadedEntity.entity.id,
        });
      }
    }
  }
}

function validateEntityPath(
  loadedEntity: LoadedEntity,
  mathematicsRoot: string,
  issues: RepositoryValidationIssue[],
): void {
  const expectedPath = expectedEntityPath(
    loadedEntity.entity,
    mathematicsRoot,
  );

  if (loadedEntity.filePath !== expectedPath) {
    issues.push({
      code: "unexpected-entity-path",
      message:
        `Entity "${loadedEntity.entity.id}" is at "${relativeEntityPath(loadedEntity.filePath, mathematicsRoot)}" but must be at "${relativeEntityPath(expectedPath, mathematicsRoot)}"`,
      entityId: loadedEntity.entity.id,
      filePath: loadedEntity.filePath,
      path: ["id"],
      targetId: loadedEntity.entity.id,
    });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function textFieldsFor(
  entity: MathematicalEntity,
): readonly { readonly fieldName: string; readonly text: string }[] {
  const displayMathDescriptions =
    entity.kind === "source" || entity.kind === "person" ? [] : entity
      .display_math
      .flatMap((expression, index) =>
        expression.description === undefined ? [] : [
          {
            fieldName: `display_math.${index}.description`,
            text: expression.description,
          },
        ]
      );

  switch (entity.kind) {
    case "person":
      return [];
    case "concept":
      return [
        {
          fieldName: "summary",
          text: entity.summary,
        },
        ...displayMathDescriptions,
      ];

    case "definition":
      return [
        {
          fieldName: "statement",
          text: entity.statement,
        },
        ...displayMathDescriptions,
      ];

    case "proposition":
      return [
        {
          fieldName: "claim",
          text: entity.claim,
        },
        ...displayMathDescriptions,
      ];

    case "proof":
      return [
        {
          fieldName: "argument",
          text: entity.argument,
        },
        ...entity.steps.flatMap((step, stepIndex) => [
          {
            fieldName: `steps.${stepIndex}.statement`,
            text: step.statement,
          },
          {
            fieldName: `steps.${stepIndex}.justification`,
            text: step.justification,
          },
          ...step.display_math.flatMap((expression, expressionIndex) =>
            expression.description === undefined ? [] : [
              {
                fieldName:
                  `steps.${stepIndex}.display_math.${expressionIndex}.description`,
                text: expression.description,
              },
            ]
          ),
        ]),
        ...displayMathDescriptions,
      ];

    case "example":
      return [
        {
          fieldName: "description",
          text: entity.description,
        },
        ...displayMathDescriptions,
      ];

    case "counterexample":
      return [
        {
          fieldName: "description",
          text: entity.description,
        },
        ...displayMathDescriptions,
      ];

    case "question":
      return [
        {
          fieldName: "asks",
          text: entity.asks,
        },
        ...displayMathDescriptions,
      ];

    case "historical_note":
      return [
        {
          fieldName: "summary",
          text: entity.summary,
        },
        {
          fieldName: "description",
          text: entity.description,
        },
        {
          fieldName: "conceptual_change",
          text: entity.conceptual_change,
        },
        ...(
          entity.prior_formulation === undefined ? [] : [
            {
              fieldName: "prior_formulation",
              text: entity.prior_formulation,
            },
          ]
        ),
        ...(
          entity.resulting_formulation === undefined ? [] : [
            {
              fieldName: "resulting_formulation",
              text: entity.resulting_formulation,
            },
          ]
        ),
        ...entity.enabled_developments.map((text, index) => ({
          fieldName: `enabled_developments.${index}`,
          text,
        })),
        ...displayMathDescriptions,
      ];

    case "source":
      return [];
  }
}

function extractTextMath(text: string): readonly TextMathExpression[] {
  const expressions: TextMathExpression[] = [];
  let index = 0;

  while (index < text.length) {
    const delimiterStart = text.indexOf("$", index);

    if (delimiterStart === -1) {
      break;
    }

    if (isEscaped(text, delimiterStart)) {
      index = delimiterStart + 1;
      continue;
    }

    const isBlock = text[delimiterStart + 1] === "$";
    const delimiter = isBlock ? "$$" : "$";
    const contentStart = delimiterStart + delimiter.length;
    const delimiterEnd = findClosingDelimiter(
      text,
      delimiter,
      contentStart,
    );

    if (delimiterEnd === -1) {
      expressions.push({
        latex: "\\invalid_unclosed_math",
        displayMode: isBlock,
        start: delimiterStart,
      });
      break;
    }

    expressions.push({
      latex: text.slice(contentStart, delimiterEnd),
      displayMode: isBlock,
      start: delimiterStart,
    });

    index = delimiterEnd + delimiter.length;
  }

  return expressions;
}

function findClosingDelimiter(
  text: string,
  delimiter: "$" | "$$",
  startIndex: number,
): number {
  let index = startIndex;

  while (index < text.length) {
    const candidateIndex = text.indexOf(delimiter, index);

    if (candidateIndex === -1) {
      return -1;
    }

    if (!isEscaped(text, candidateIndex)) {
      return candidateIndex;
    }

    index = candidateIndex + delimiter.length;
  }

  return -1;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === "\\") {
    slashCount += 1;
    cursor -= 1;
  }

  return slashCount % 2 === 1;
}

function validateReferences(
  loadedEntity: LoadedEntity,
  entitiesById: ReadonlyMap<string, LoadedEntity>,
  issues: RepositoryValidationIssue[],
): void {
  const rules = referenceRulesFor(loadedEntity.entity);

  for (const rule of rules) {
    const targetIds = getReferenceIds(loadedEntity.entity, rule.path);

    for (const targetId of targetIds) {
      const targetEntity = entitiesById.get(targetId);

      if (targetEntity === undefined) {
        issues.push({
          code: "unresolved-reference",
          message:
            `Entity "${loadedEntity.entity.id}" references missing entity "${targetId}" at ${rule.path.join(".")}`,
          entityId: loadedEntity.entity.id,
          filePath: loadedEntity.filePath,
          path: rule.path,
          targetId,
        });
        continue;
      }

      if (!rule.targetKinds.includes(targetEntity.entity.kind)) {
        issues.push({
          code: "wrong-reference-kind",
          message:
            `Entity "${loadedEntity.entity.id}" references "${targetId}" as ${rule.path.join(".")}, but target kind is "${targetEntity.entity.kind}"`,
          entityId: loadedEntity.entity.id,
          filePath: loadedEntity.filePath,
          path: rule.path,
          targetId,
        });
      }
    }
  }

  validateProofStepReferences(loadedEntity, entitiesById, issues);
}

function validateProofStepReferences(
  loadedEntity: LoadedEntity,
  entitiesById: ReadonlyMap<string, LoadedEntity>,
  issues: RepositoryValidationIssue[],
): void {
  const { entity } = loadedEntity;

  if (entity.kind !== "proof") {
    return;
  }

  for (const [stepIndex, step] of entity.steps.entries()) {
    for (const targetId of step.depends_on) {
      const targetEntity = entitiesById.get(targetId);
      const path = ["steps", String(stepIndex), "depends_on"];

      if (targetEntity === undefined) {
        issues.push({
          code: "unresolved-reference",
          message:
            `Entity "${entity.id}" references missing entity "${targetId}" at ${path.join(".")}`,
          entityId: entity.id,
          filePath: loadedEntity.filePath,
          path,
          targetId,
        });
        continue;
      }

      if (!isMathematicalEntityKind(targetEntity.entity.kind)) {
        issues.push({
          code: "wrong-reference-kind",
          message:
            `Entity "${entity.id}" references "${targetId}" as ${path.join(".")}, but target kind is "${targetEntity.entity.kind}"`,
          entityId: entity.id,
          filePath: loadedEntity.filePath,
          path,
          targetId,
        });
      }
    }
  }
}

function validateConceptDefinitionConsistency(
  loadedEntities: readonly LoadedEntity[],
  entitiesById: ReadonlyMap<string, LoadedEntity>,
  issues: RepositoryValidationIssue[],
): void {
  for (const loadedEntity of loadedEntities) {
    const { entity } = loadedEntity;

    if (entity.kind !== "concept") {
      continue;
    }

    for (const definitionId of entity.defined_by) {
      const definition = entitiesById.get(definitionId)?.entity;

      if (definition?.kind !== "definition") {
        continue;
      }

      if (!definition.defines.includes(entity.id)) {
        issues.push({
          code: "inconsistent-concept-definition",
          message:
            `Concept "${entity.id}" lists "${definitionId}" in defined_by, but the definition does not define the concept`,
          entityId: entity.id,
          filePath: loadedEntity.filePath,
          path: ["defined_by"],
          targetId: definitionId,
        });
      }
    }
  }
}

function validateDefinitionSetConsistency(
  loadedEntities: readonly LoadedEntity[],
  entitiesById: ReadonlyMap<string, LoadedEntity>,
  issues: RepositoryValidationIssue[],
): void {
  for (const loadedEntity of loadedEntities) {
    const { entity } = loadedEntity;

    if (entity.kind !== "concept") {
      continue;
    }

    const primaryDefinitions = entity.defined_by
      .map((definitionId) => entitiesById.get(definitionId)?.entity)
      .filter((definition) =>
        definition?.kind === "definition" &&
        definition.definition_role === "primary"
      );

    if (primaryDefinitions.length !== 1) {
      issues.push({
        code: "invalid-definition-set",
        message:
          `Concept "${entity.id}" must have exactly one primary definition, but has ${primaryDefinitions.length}`,
        entityId: entity.id,
        filePath: loadedEntity.filePath,
        path: ["defined_by"],
        targetId: entity.id,
      });
    }
  }
}

function validateEquivalentDefinitionConsistency(
  loadedEntities: readonly LoadedEntity[],
  entitiesById: ReadonlyMap<string, LoadedEntity>,
  issues: RepositoryValidationIssue[],
): void {
  for (const loadedEntity of loadedEntities) {
    const { entity } = loadedEntity;

    if (entity.kind !== "definition") {
      continue;
    }

    for (const equivalentDefinitionId of entity.equivalent_to) {
      const equivalentDefinition = entitiesById.get(equivalentDefinitionId)
        ?.entity;

      if (equivalentDefinition?.kind !== "definition") {
        continue;
      }

      if (!sameEntityIdSet(entity.defines, equivalentDefinition.defines)) {
        issues.push({
          code: "invalid-definition-set",
          message:
            `Definition "${entity.id}" lists "${equivalentDefinitionId}" as equivalent, but they do not define the same concepts`,
          entityId: entity.id,
          filePath: loadedEntity.filePath,
          path: ["equivalent_to"],
          targetId: equivalentDefinitionId,
        });
      }
    }
  }
}

function sameEntityIdSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length &&
    [...left].sort().every((leftId, index) => leftId === [...right].sort()[index]);
}

function referenceRulesFor(
  entity: MathematicalEntity,
): readonly ReferenceRule[] {
  switch (entity.kind) {
    case "concept":
      return [
        {
          path: ["defined_by"],
          targetKinds: ["definition"],
        },
        {
          path: ["broader_concepts"],
          targetKinds: ["concept"],
        },
      ];

    case "definition":
      return [
        {
          path: ["defines"],
          targetKinds: ["concept"],
        },
        {
          path: ["equivalent_to"],
          targetKinds: ["definition"],
        },
        {
          path: ["depends_on"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "proposition":
      return [
        {
          path: ["depends_on"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "proof":
      return [
        {
          path: ["proves"],
          targetKinds: ["proposition"],
        },
        {
          path: ["depends_on"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "example":
      return [
        {
          path: ["example_of"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "counterexample":
      return [
        {
          path: ["counterexample_to"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["demonstrates_necessity_of"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "question":
      return [
        {
          path: ["motivates"],
          targetKinds: [
            "concept",
            "definition",
            "proposition",
            "proof",
            "example",
            "counterexample",
            "question",
          ],
        },
        {
          path: ["related_concepts"],
          targetKinds: ["concept"],
        },
        {
          path: ["prerequisite_questions"],
          targetKinds: ["question"],
        },
        {
          path: ["successor_questions"],
          targetKinds: ["question"],
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "historical_note":
      return [
        {
          path: ["subjects"],
          targetKinds: [
            "concept",
            "definition",
            "proposition",
            "proof",
            "example",
            "counterexample",
            "question",
          ],
        },
        {
          path: ["developed_from"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["developed_into"],
          targetKinds: MATHEMATICAL_ENTITY_KINDS,
        },
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "source":
      return [
        {
          path: ["author_refs"],
          targetKinds: ["person"],
        },
      ];
    case "person":
      return [
        {
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];
  }
}

function getReferenceIds(
  entity: MathematicalEntity,
  path: readonly string[],
): readonly string[] {
  const [fieldName] = path;

  if (fieldName === undefined) {
    return [];
  }

  const value = entity[fieldName as keyof MathematicalEntity];

  if (fieldName === "source_refs" && Array.isArray(value)) {
    return value.flatMap((reference) =>
      isSourceReferenceLike(reference) ? [reference.source] : []
    );
  }

  return Array.isArray(value) ? value : [];
}

function isSourceReferenceLike(
  value: unknown,
): value is { readonly source: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "source" in value &&
    typeof value.source === "string"
  );
}
