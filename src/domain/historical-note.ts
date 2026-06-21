import { z } from "zod";

import { DisplayMathSchema } from "./display-math.js";
import { findDuplicates } from "./duplicates.js";
import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const HistoricalNoteDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Historical note description cannot be empty");

export const HistoricalNoteDateLabelSchema = z
  .string()
  .trim()
  .min(1, "Historical note date label cannot be empty");

export const HistoricalNoteEventTypeSchema = z.enum([
  "origin",
  "publication",
  "formalization",
  "generalization",
  "terminology",
  "application",
  "synthesis",
]);

export const HistoricalNoteYearSchema = z
  .number()
  .int()
  .min(-3000)
  .max(9999);

export const HistoricalNoteSchema = EntityBaseSchema.extend({
  kind: z.literal("historical_note"),

  date_label: HistoricalNoteDateLabelSchema,

  event_type: HistoricalNoteEventTypeSchema,

  start_year: HistoricalNoteYearSchema,

  end_year: HistoricalNoteYearSchema.optional(),

  description: HistoricalNoteDescriptionSchema,

  display_math: DisplayMathSchema,

  subjects: z
    .array(EntityIdSchema)
    .min(1, "A historical note must describe at least one subject"),

  developed_from: z
    .array(EntityIdSchema)
    .default([]),

  developed_into: z
    .array(EntityIdSchema)
    .default([]),

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((note, context) => {
  if (note.end_year !== undefined && note.end_year < note.start_year) {
    context.addIssue({
      code: "custom",
      path: ["end_year"],
      message: "Historical note end_year cannot be earlier than start_year",
    });
  }

  const duplicateSubjects = findDuplicates(note.subjects);

  if (duplicateSubjects.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["subjects"],
      message: `Duplicate historical note subjects: ${duplicateSubjects.join(", ")}`,
    });
  }

  const duplicatePredecessors = findDuplicates(note.developed_from);

  if (duplicatePredecessors.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["developed_from"],
      message:
        `Duplicate predecessor ideas: ${duplicatePredecessors.join(", ")}`,
    });
  }

  const duplicateSuccessors = findDuplicates(note.developed_into);

  if (duplicateSuccessors.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["developed_into"],
      message: `Duplicate successor ideas: ${duplicateSuccessors.join(", ")}`,
    });
  }

  const duplicateSources = findDuplicates(
    note.source_refs.map((reference) => reference.source),
  );

  if (duplicateSources.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["source_refs"],
      message: `Duplicate source references: ${duplicateSources.join(", ")}`,
    });
  }
});

export type HistoricalNote = z.infer<typeof HistoricalNoteSchema>;

export function parseHistoricalNote(value: unknown): HistoricalNote {
  return HistoricalNoteSchema.parse(value);
}

export function isHistoricalNote(
  value: unknown,
): value is HistoricalNote {
  return HistoricalNoteSchema.safeParse(value).success;
}
