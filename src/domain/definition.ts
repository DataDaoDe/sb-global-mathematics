import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { findDuplicates } from "./duplicates.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const DefinitionStatementSchema = z
  .string()
  .trim()
  .min(1, "Definition statement cannot be empty");

export const DefinitionSchema = EntityBaseSchema.extend({
  kind: z.literal("definition"),

  defines: z
    .array(EntityIdSchema)
    .min(1, "A definition must define at least one concept"),

  depends_on: z
    .array(EntityIdSchema)
    .default([]),

  statement: DefinitionStatementSchema,

  display_math: DisplayMathSchema,

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((definition, context) => {
  const duplicateDefinedConcepts = findDuplicates(definition.defines);

  if (duplicateDefinedConcepts.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["defines"],
      message: `Duplicate defined concepts: ${duplicateDefinedConcepts.join(", ")}`,
    });
  }

  const duplicateDependencies = findDuplicates(definition.depends_on);

  if (duplicateDependencies.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["depends_on"],
      message: `Duplicate dependencies: ${duplicateDependencies.join(", ")}`,
    });
  }

  const duplicateSources = findDuplicates(
    definition.source_refs.map((reference) => reference.source),
  );

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type Definition = z.infer<typeof DefinitionSchema>;

export function parseDefinition(value: unknown): Definition {
  return DefinitionSchema.parse(value);
}

export function isDefinition(value: unknown): value is Definition {
  return DefinitionSchema.safeParse(value).success;
}
