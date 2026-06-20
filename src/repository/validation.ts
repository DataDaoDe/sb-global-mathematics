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
] as const satisfies readonly SupportedEntityKind[];

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

  return {
    valid: issues.length === 0,
    issues,
  };
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

  if (entity.kind === "source") {
    return;
  }

  for (const [index, expression] of entity.display_math.entries()) {
    try {
      katex.renderToString(expression.latex, {
        displayMode: true,
        throwOnError: true,
        strict: "error",
      });
    } catch (error) {
      issues.push({
        code: "invalid-display-math",
        message:
          `Entity "${entity.id}" has invalid display math at display_math.${index}: ${errorMessage(error)}`,
        entityId: entity.id,
        filePath: loadedEntity.filePath,
        path: ["display_math", String(index), "latex"],
        targetId: entity.id,
      });
    }
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
  switch (entity.kind) {
    case "concept":
      return [
        {
          fieldName: "summary",
          text: entity.summary,
        },
      ];

    case "definition":
      return [
        {
          fieldName: "statement",
          text: entity.statement,
        },
      ];

    case "proposition":
      return [
        {
          fieldName: "claim",
          text: entity.claim,
        },
      ];

    case "proof":
      return [
        {
          fieldName: "argument",
          text: entity.argument,
        },
      ];

    case "example":
      return [
        {
          fieldName: "description",
          text: entity.description,
        },
      ];

    case "counterexample":
      return [
        {
          fieldName: "description",
          text: entity.description,
        },
      ];

    case "question":
      return [
        {
          fieldName: "asks",
          text: entity.asks,
        },
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
          path: ["source_refs"],
          targetKinds: ["source"],
        },
      ];

    case "source":
      return [];
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

  return Array.isArray(value) ? value : [];
}
