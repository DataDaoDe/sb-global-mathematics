import { z } from "zod";

import {
  DisplayMathExpressionSchema,
  DisplayMathSchema,
} from "./display-math.js";
import { findDuplicates } from "./duplicates.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const ProofMethodSchema = z
  .string()
  .trim()
  .min(1, "Proof method cannot be empty")
  .max(100, "Proof method cannot exceed 100 characters");

export const ProofArgumentSchema = z
  .string()
  .trim()
  .min(1, "Proof argument cannot be empty");

export const ProofStepLabelSchema = z
  .string()
  .trim()
  .min(1, "Proof step label cannot be empty")
  .max(80, "Proof step label cannot exceed 80 characters");

export const ProofStepStatementSchema = z
  .string()
  .trim()
  .min(1, "Proof step statement cannot be empty");

export const ProofStepJustificationSchema = z
  .string()
  .trim()
  .min(1, "Proof step justification cannot be empty");

export const ProofStepSchema = z
  .object({
    label: ProofStepLabelSchema,

    statement: ProofStepStatementSchema,

    justification: ProofStepJustificationSchema,

    depends_on: z
      .array(EntityIdSchema)
      .default([]),

    display_math: z
      .array(DisplayMathExpressionSchema)
      .default([]),
  })
  .strict();

export const ProofSchema = EntityBaseSchema.extend({
  kind: z.literal("proof"),

  proves: z
    .array(EntityIdSchema)
    .min(1, "A proof must prove at least one proposition"),

  method: ProofMethodSchema,

  argument: ProofArgumentSchema,

  steps: z
    .array(ProofStepSchema)
    .default([]),

  display_math: DisplayMathSchema,

  depends_on: z
    .array(EntityIdSchema)
    .default([]),

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((proof, context) => {
  const duplicatePropositions = findDuplicates(proof.proves);

  if (duplicatePropositions.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["proves"],
      message: `Duplicate proved propositions: ${duplicatePropositions.join(", ")}`,
    });
  }

  const duplicateDependencies = findDuplicates(proof.depends_on);

  if (duplicateDependencies.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["depends_on"],
      message: `Duplicate dependencies: ${duplicateDependencies.join(", ")}`,
    });
  }

  const duplicateStepLabels = findDuplicates(
    proof.steps.map((step) => step.label),
  );

  if (duplicateStepLabels.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["steps"],
      message: `Duplicate proof step labels: ${duplicateStepLabels.join(", ")}`,
    });
  }

  proof.steps.forEach((step, index) => {
    const duplicateStepDependencies = findDuplicates(step.depends_on);

    if (duplicateStepDependencies.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["steps", index, "depends_on"],
        message:
          `Duplicate proof step dependencies: ${duplicateStepDependencies.join(", ")}`,
      });
    }
  });

  const duplicateSources = findDuplicates(
    proof.source_refs.map((reference) => reference.source),
  );

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type Proof = z.infer<typeof ProofSchema>;
export type ProofStep = z.infer<typeof ProofStepSchema>;

export function parseProof(value: unknown): Proof {
  return ProofSchema.parse(value);
}

export function isProof(value: unknown): value is Proof {
  return ProofSchema.safeParse(value).success;
}
