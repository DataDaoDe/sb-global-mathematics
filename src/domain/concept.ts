import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { findDuplicates } from "./duplicates.js";

export const ConceptSummarySchema = z
  .string()
  .trim()
  .min(1, "Concept summary cannot be empty")
  .max(500, "Concept summary cannot exceed 500 characters");

export const ConceptSchema = EntityBaseSchema.extend({
  kind: z.literal("concept"),

  summary: ConceptSummarySchema,

  display_math: DisplayMathSchema,

  defined_by: z
    .array(EntityIdSchema)
    .min(1, "A concept must have at least one definition"),

  broader_concepts: z
    .array(EntityIdSchema)
    .default([]),
}).superRefine((concept, context) => {
  const duplicateDefinitions = findDuplicates(concept.defined_by);

  if (duplicateDefinitions.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["defined_by"],
      message: `Duplicate definition references: ${duplicateDefinitions.join(", ")}`,
    });
  }

  const duplicateBroaderConcepts = findDuplicates(
    concept.broader_concepts,
  );

  if (duplicateBroaderConcepts.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["broader_concepts"],
      message:
        `Duplicate broader concept references: ${
          duplicateBroaderConcepts.join(", ")
        }`,
    });
  }

  if (concept.broader_concepts.includes(concept.id)) {
    context.addIssue({
      code: "custom",
      path: ["broader_concepts"],
      message: "A concept cannot be broader than itself",
    });
  }
});

export type Concept = z.infer<typeof ConceptSchema>;

export function parseConcept(value: unknown): Concept {
  return ConceptSchema.parse(value);
}

export function isConcept(value: unknown): value is Concept {
  return ConceptSchema.safeParse(value).success;
}
