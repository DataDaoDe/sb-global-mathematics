import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { findDuplicates } from "./duplicates.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const ExampleDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Example description cannot be empty");

export const ExampleSchema = EntityBaseSchema.extend({
  kind: z.literal("example"),

  example_of: z
    .array(EntityIdSchema)
    .min(1, "An example must illustrate at least one entity"),

  description: ExampleDescriptionSchema,

  display_math: DisplayMathSchema,

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((example, context) => {
  const duplicateExampleTargets = findDuplicates(example.example_of);

  if (duplicateExampleTargets.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["example_of"],
      message: `Duplicate example targets: ${duplicateExampleTargets.join(", ")}`,
    });
  }

  const duplicateSources = findDuplicates(
    example.source_refs.map((reference) => reference.source),
  );

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type Example = z.infer<typeof ExampleSchema>;

export function parseExample(value: unknown): Example {
  return ExampleSchema.parse(value);
}

export function isExample(value: unknown): value is Example {
  return ExampleSchema.safeParse(value).success;
}
