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

export const DefinitionRoleSchema = z.enum([
  "primary",
  "equivalent",
  "alternative",
  "historical",
  "contextual",
]);

export const DefinitionStyleSchema = z.enum([
  "formal",
  "intuitive",
  "constructive",
  "axiomatic",
  "categorical",
  "set-theoretic",
]);

export const DefinitionScopeSchema = z
  .string()
  .trim()
  .min(1, "Definition scope cannot be empty")
  .max(200, "Definition scope cannot exceed 200 characters");

export const DefinitionSchema = EntityBaseSchema.extend({
  kind: z.literal("definition"),

  definition_role: DefinitionRoleSchema.default("primary"),

  definition_style: DefinitionStyleSchema.default("formal"),

  scope: DefinitionScopeSchema.optional(),

  defines: z
    .array(EntityIdSchema)
    .min(1, "A definition must define at least one concept"),

  equivalent_to: z
    .array(EntityIdSchema)
    .default([]),

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

  const duplicateEquivalentDefinitions = findDuplicates(
    definition.equivalent_to,
  );

  if (duplicateEquivalentDefinitions.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["equivalent_to"],
      message:
        `Duplicate equivalent definitions: ${
          duplicateEquivalentDefinitions.join(", ")
        }`,
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
