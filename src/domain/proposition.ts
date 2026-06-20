import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { findDuplicates } from "./duplicates.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";

export const PropositionTypeSchema = z.enum([
  "theorem",
  "lemma",
  "proposition",
  "corollary",
]);

export const PropositionClaimSchema = z
  .string()
  .trim()
  .min(1, "Proposition claim cannot be empty");

export const PropositionSchema = EntityBaseSchema.extend({
  kind: z.literal("proposition"),

  proposition_type: PropositionTypeSchema,

  claim: PropositionClaimSchema,

  display_math: DisplayMathSchema,

  depends_on: z
    .array(EntityIdSchema)
    .default([]),

  source_refs: z
    .array(EntityIdSchema)
    .default([]),
}).superRefine((proposition, context) => {
  const duplicateDependencies = findDuplicates(proposition.depends_on);

  if (duplicateDependencies.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["depends_on"],
      message: `Duplicate dependencies: ${duplicateDependencies.join(", ")}`,
    });
  }

  const duplicateSources = findDuplicates(proposition.source_refs);

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type Proposition = z.infer<typeof PropositionSchema>;

export function parseProposition(value: unknown): Proposition {
  return PropositionSchema.parse(value);
}

export function isProposition(
  value: unknown,
): value is Proposition {
  return PropositionSchema.safeParse(value).success;
}
