import { z } from "zod";

import { EntityIdSchema } from "./entity-id.js";
import { EntityKindSchema } from "./entity-kind.js";

export const EntityTitleSchema = z
  .string()
  .trim()
  .min(1, "Entity title cannot be empty")
  .max(200, "Entity title cannot exceed 200 characters");

export const EntityBaseSchema = z
  .object({
    id: EntityIdSchema,
    kind: EntityKindSchema,
    title: EntityTitleSchema,
  })
  .strict();

export type EntityBase = z.infer<typeof EntityBaseSchema>;