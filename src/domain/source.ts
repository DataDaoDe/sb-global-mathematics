import { z } from "zod";

import { EntityBaseSchema } from "./entity-base.js";

export const SourceTypeSchema = z.enum([
  "book",
  "paper",
  "manuscript",
  "lecture",
  "formal-library",
  "encyclopedia",
  "web-page",
]);

export const SourceAuthorSchema = z
  .string()
  .trim()
  .min(1, "Source author cannot be empty")
  .max(200, "Source author cannot exceed 200 characters");

export const SourceSchema = EntityBaseSchema.extend({
  kind: z.literal("source"),

  source_type: SourceTypeSchema,

  authors: z
    .array(SourceAuthorSchema)
    .default([]),

  year: z
    .number()
    .int()
    .min(0)
    .max(9999)
    .optional(),

  locator: z
    .string()
    .trim()
    .min(1, "Source locator cannot be empty")
    .optional(),
});

export type Source = z.infer<typeof SourceSchema>;

export function parseSource(value: unknown): Source {
  return SourceSchema.parse(value);
}

export function isSource(value: unknown): value is Source {
  return SourceSchema.safeParse(value).success;
}
