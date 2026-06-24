import { z } from "zod";

import {
  ConceptSchema,
  type Concept,
} from "./concept.js";
import {
  CounterexampleSchema,
  type Counterexample,
} from "./counterexample.js";
import {
  DefinitionSchema,
  type Definition,
} from "./definition.js";
import {
  ExampleSchema,
  type Example,
} from "./example.js";
import {
  HistoricalNoteSchema,
  type HistoricalNote,
} from "./historical-note.js";
import {
  ProofSchema,
  type Proof,
} from "./proof.js";
import {
  PersonSchema,
  type Person,
} from "./person.js";
import {
  PropositionSchema,
  type Proposition,
} from "./proposition.js";
import {
  EntityKindSchema,
  type EntityKind,
} from "./entity-kind.js";
import {
  QuestionSchema,
  type Question,
} from "./question.js";
import {
  SourceSchema,
  type Source,
} from "./source.js";

export const EntitySchemas = {
  concept: ConceptSchema,
  definition: DefinitionSchema,
  proposition: PropositionSchema,
  proof: ProofSchema,
  example: ExampleSchema,
  counterexample: CounterexampleSchema,
  question: QuestionSchema,
  historical_note: HistoricalNoteSchema,
  source: SourceSchema,
  person: PersonSchema,
} as const;

export type SupportedEntityKind =
  keyof typeof EntitySchemas;

export type MathematicalEntity =
  | Concept
  | Definition
  | Proposition
  | Proof
  | Example
  | Counterexample
  | Question
  | HistoricalNote
  | Source
  | Person;

const EntityEnvelopeSchema = z
  .object({
    kind: EntityKindSchema,
  })
  .passthrough();

export class UnsupportedEntityKindError extends Error {
  readonly kind: EntityKind;

  constructor(kind: EntityKind) {
    super(`Entity kind is not yet supported: ${kind}`);

    this.name = "UnsupportedEntityKindError";
    this.kind = kind;
  }
}

export function isSupportedEntityKind(
  kind: EntityKind,
): kind is SupportedEntityKind {
  return kind in EntitySchemas;
}

export function parseMathematicalEntity(
  value: unknown,
): MathematicalEntity {
  const envelope = EntityEnvelopeSchema.parse(value);
  const { kind } = envelope;

  if (!isSupportedEntityKind(kind)) {
    throw new UnsupportedEntityKindError(kind);
  }

  const schema = EntitySchemas[kind];

  return schema.parse(value);
}
