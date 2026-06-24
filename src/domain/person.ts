import { z } from "zod";

import { EntityBaseSchema } from "./entity-base.js";
import { SourceReferencesSchema } from "./source-reference.js";

export const PersonSortNameSchema = z
  .string()
  .trim()
  .min(1, "Person sort name cannot be empty")
  .max(200, "Person sort name cannot exceed 200 characters");

export const PersonSchema = EntityBaseSchema.extend({
  kind: z.literal("person"),

  sort_name: PersonSortNameSchema.optional(),

  birth_year: z
    .number()
    .int()
    .min(-3000)
    .max(9999)
    .optional(),

  death_year: z
    .number()
    .int()
    .min(-3000)
    .max(9999)
    .optional(),

  source_refs: z
    .array(SourceReferencesSchema.element)
    .default([]),
}).superRefine((person, context) => {
  if (
    person.birth_year !== undefined &&
    person.death_year !== undefined &&
    person.death_year < person.birth_year
  ) {
    context.addIssue({
      code: "custom",
      path: ["death_year"],
      message: "Person death year cannot be earlier than birth year",
    });
  }
});

export type Person = z.infer<typeof PersonSchema>;

export function parsePerson(value: unknown): Person {
  return PersonSchema.parse(value);
}

export function isPerson(value: unknown): value is Person {
  return PersonSchema.safeParse(value).success;
}
