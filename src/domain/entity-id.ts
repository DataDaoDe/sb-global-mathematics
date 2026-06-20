import { z } from "zod";

/**
 * One identifier segment:
 *
 * algebra
 * ring
 * commutative-unital
 * l2-space
 *
 * Invalid:
 *
 * Algebra
 * -ring
 * ring-
 * commutative--unital
 */
const ENTITY_ID_SEGMENT = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";

/**
 * Require at least two period-separated segments.
 *
 * Valid:
 * algebra.group
 * algebra.ring.commutative-unital
 * topology.separation.t0-space
 */
const ENTITY_ID_PATTERN = new RegExp(
  `^${ENTITY_ID_SEGMENT}(?:\\.${ENTITY_ID_SEGMENT})+$`,
);

export const EntityIdSchema = z
  .string()
  .regex(
    ENTITY_ID_PATTERN,
    "Entity ID must contain at least two lowercase, period-separated segments",
  )
  .brand<"EntityId">();

export type EntityId = z.infer<typeof EntityIdSchema>;

export function parseEntityId(value: unknown): EntityId {
  return EntityIdSchema.parse(value);
}

export function isEntityId(value: unknown): value is EntityId {
  return EntityIdSchema.safeParse(value).success;
}