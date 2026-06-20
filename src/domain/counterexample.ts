import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { findDuplicates } from "./duplicates.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const CounterexampleDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Counterexample description cannot be empty");

export const CounterexampleSchema = EntityBaseSchema.extend({
  kind: z.literal("counterexample"),

  counterexample_to: z
    .array(EntityIdSchema)
    .min(1, "A counterexample must target at least one entity"),

  demonstrates_necessity_of: z
    .array(EntityIdSchema)
    .default([]),

  description: CounterexampleDescriptionSchema,

  display_math: DisplayMathSchema,

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((counterexample, context) => {
  const duplicateTargets = findDuplicates(
    counterexample.counterexample_to,
  );

  if (duplicateTargets.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["counterexample_to"],
      message: `Duplicate counterexample targets: ${duplicateTargets.join(", ")}`,
    });
  }

  const duplicateNecessaryEntities = findDuplicates(
    counterexample.demonstrates_necessity_of,
  );

  if (duplicateNecessaryEntities.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["demonstrates_necessity_of"],
      message:
        `Duplicate necessity targets: ${duplicateNecessaryEntities.join(", ")}`,
    });
  }

  const duplicateSources = findDuplicates(
    counterexample.source_refs.map((reference) => reference.source),
  );

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type Counterexample = z.infer<typeof CounterexampleSchema>;

export function parseCounterexample(value: unknown): Counterexample {
  return CounterexampleSchema.parse(value);
}

export function isCounterexample(
  value: unknown,
): value is Counterexample {
  return CounterexampleSchema.safeParse(value).success;
}
