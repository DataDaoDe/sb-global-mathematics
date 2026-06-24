import { z } from "zod";

import { EntityBaseSchema } from "./entity-base.js";
import { EntityIdSchema } from "./entity-id.js";

export const SourceTypeSchema = z.enum([
  "book",
  "paper",
  "manuscript",
  "lecture",
  "formal-library",
  "encyclopedia",
  "web-page",
]);

export const SourceDoiSchema = z
  .string()
  .trim()
  .regex(/^10\.\d{4,9}\/\S+$/u, "Source DOI must look like 10.xxxx/suffix");

export const SourceIsbnSchema = z
  .string()
  .trim()
  .regex(
    /^(?:97[89][-\s]?)?\d[-\s]?(?:\d[-\s]?){7,10}[\dX]$/u,
    "Source ISBN must look like an ISBN-10 or ISBN-13",
  );

export const SourceSchema = EntityBaseSchema.extend({
  kind: z.literal("source"),

  source_type: SourceTypeSchema,

  author_refs: z
    .array(EntityIdSchema)
    .default([]),

  year: z
    .number()
    .int()
    .min(-3000)
    .max(9999)
    .optional(),

  locator: z
    .string()
    .trim()
    .min(1, "Source locator cannot be empty")
    .optional(),

  doi: SourceDoiSchema.optional(),

  isbn: SourceIsbnSchema.optional(),
});

export type Source = z.infer<typeof SourceSchema>;

export function parseSource(value: unknown): Source {
  return SourceSchema.parse(value);
}

export function isSource(value: unknown): value is Source {
  return SourceSchema.safeParse(value).success;
}
