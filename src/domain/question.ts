import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { findDuplicates } from "./duplicates.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const QuestionTextSchema = z
  .string()
  .trim()
  .min(1, "Question text cannot be empty");

export const QuestionSchema = EntityBaseSchema.extend({
  kind: z.literal("question"),

  asks: QuestionTextSchema,

  display_math: DisplayMathSchema,

  motivates: z
    .array(EntityIdSchema)
    .default([]),

  related_concepts: z
    .array(EntityIdSchema)
    .default([]),

  prerequisite_questions: z
    .array(EntityIdSchema)
    .default([]),

  successor_questions: z
    .array(EntityIdSchema)
    .default([]),

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((question, context) => {
  const duplicateMotivatedEntities = findDuplicates(question.motivates);

  if (duplicateMotivatedEntities.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["motivates"],
      message: `Duplicate motivated entities: ${duplicateMotivatedEntities.join(", ")}`,
    });
  }

  const duplicateRelatedConcepts = findDuplicates(question.related_concepts);

  if (duplicateRelatedConcepts.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["related_concepts"],
      message: `Duplicate related concepts: ${duplicateRelatedConcepts.join(", ")}`,
    });
  }

  const duplicatePrerequisiteQuestions = findDuplicates(
    question.prerequisite_questions,
  );

  if (duplicatePrerequisiteQuestions.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["prerequisite_questions"],
      message:
        `Duplicate prerequisite questions: ${
          duplicatePrerequisiteQuestions.join(", ")
        }`,
    });
  }

  const duplicateSuccessorQuestions = findDuplicates(
    question.successor_questions,
  );

  if (duplicateSuccessorQuestions.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["successor_questions"],
      message:
        `Duplicate successor questions: ${
          duplicateSuccessorQuestions.join(", ")
        }`,
    });
  }

  if (question.prerequisite_questions.includes(question.id)) {
    context.addIssue({
      code: "custom",
      path: ["prerequisite_questions"],
      message: "A question cannot be a prerequisite of itself",
    });
  }

  if (question.successor_questions.includes(question.id)) {
    context.addIssue({
      code: "custom",
      path: ["successor_questions"],
      message: "A question cannot be a successor of itself",
    });
  }

  const duplicateSources = findDuplicates(
    question.source_refs.map((reference) => reference.source),
  );

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type Question = z.infer<typeof QuestionSchema>;

export function parseQuestion(value: unknown): Question {
  return QuestionSchema.parse(value);
}

export function isQuestion(value: unknown): value is Question {
  return QuestionSchema.safeParse(value).success;
}
