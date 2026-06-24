import { z } from "zod";

export const EntityKindSchema = z.enum([
  "concept",
  "definition",
  "proposition",
  "proof",
  "example",
  "counterexample",
  "question",
  "historical_note",
  "source",
  "person",
]);

export type EntityKind = z.infer<typeof EntityKindSchema>;
