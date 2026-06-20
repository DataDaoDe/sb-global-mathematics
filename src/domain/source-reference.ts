import { z } from "zod";

import { EntityIdSchema } from "./entity-id.js";

export const SourceReferenceLocatorSchema = z
  .string()
  .trim()
  .min(1, "Source reference locator cannot be empty")
  .max(300, "Source reference locator cannot exceed 300 characters");

export const SourceReferenceNoteSchema = z
  .string()
  .trim()
  .min(1, "Source reference note cannot be empty")
  .max(500, "Source reference note cannot exceed 500 characters");

export const SourceReferenceSchema = z.object({
  source: EntityIdSchema,
  locator: SourceReferenceLocatorSchema.optional(),
  note: SourceReferenceNoteSchema.optional(),
}).strict();

export const SourceReferencesSchema = z.array(SourceReferenceSchema);

export type SourceReference = z.infer<typeof SourceReferenceSchema>;
