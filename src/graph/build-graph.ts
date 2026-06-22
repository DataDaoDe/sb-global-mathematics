import {
  type EntityId,
} from "../domain/entity-id.js";
import type { MathematicalEntity } from "../domain/mathematical-entity.js";
import type { SourceReference } from "../domain/source-reference.js";
import type { LoadedEntity } from "../repository/validation.js";
import {
  createArtifactMetadata,
  type ArtifactMetadata,
} from "../artifacts/metadata.js";

export type GraphRelation =
  | "defined_by"
  | "broader_concept"
  | "defines"
  | "equivalent_to"
  | "depends_on"
  | "source_ref"
  | "proves"
  | "example_of"
  | "counterexample_to"
  | "demonstrates_necessity_of"
  | "motivates"
  | "prerequisite_question"
  | "successor_question"
  | "historical_context_for"
  | "developed_from"
  | "developed_into"
  | "related_concept";

export type GraphEntity = {
  readonly id: EntityId;
  readonly kind: MathematicalEntity["kind"];
  readonly title: string;
  readonly data: MathematicalEntity;
};

export type GraphEdge = {
  readonly from: EntityId;
  readonly relation: GraphRelation;
  readonly to: EntityId;
};

export type GraphArtifact = {
  readonly metadata: ArtifactMetadata;
  readonly entities: readonly GraphEntity[];
  readonly edges: readonly GraphEdge[];
};

export function buildGraph(
  loadedEntities: readonly LoadedEntity[],
): GraphArtifact {
  const entities = loadedEntities
    .map(({ entity }) => ({
      id: entity.id,
      kind: entity.kind,
      title: entity.title,
      data: entity,
    }))
    .sort(compareEntities);

  const edges = loadedEntities
    .flatMap(({ entity }) => edgesForEntity(entity))
    .sort(compareEdges);

  return {
    metadata: createArtifactMetadata(entities.length, edges.length),
    entities,
    edges,
  };
}

function edgesForEntity(entity: MathematicalEntity): GraphEdge[] {
  switch (entity.kind) {
    case "concept":
      return [
        ...entity.defined_by.map((targetId) =>
          edge(entity.id, "defined_by", targetId)
        ),
        ...entity.broader_concepts.map((targetId) =>
          edge(entity.id, "broader_concept", targetId)
        ),
      ];

    case "definition":
      return [
        ...entity.defines.map((targetId) =>
          edge(entity.id, "defines", targetId)
        ),
        ...entity.equivalent_to.map((targetId) =>
          edge(entity.id, "equivalent_to", targetId)
        ),
        ...entity.depends_on.map((targetId) =>
          edge(entity.id, "depends_on", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "proposition":
      return [
        ...entity.depends_on.map((targetId) =>
          edge(entity.id, "depends_on", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "proof":
      return [
        ...entity.proves.map((targetId) =>
          edge(entity.id, "proves", targetId)
        ),
        ...entity.depends_on.map((targetId) =>
          edge(entity.id, "depends_on", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "example":
      return [
        ...entity.example_of.map((targetId) =>
          edge(entity.id, "example_of", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "counterexample":
      return [
        ...entity.counterexample_to.map((targetId) =>
          edge(entity.id, "counterexample_to", targetId)
        ),
        ...entity.demonstrates_necessity_of.map((targetId) =>
          edge(entity.id, "demonstrates_necessity_of", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "question":
      return [
        ...entity.motivates.map((targetId) =>
          edge(entity.id, "motivates", targetId)
        ),
        ...entity.related_concepts.map((targetId) =>
          edge(entity.id, "related_concept", targetId)
        ),
        ...entity.prerequisite_questions.map((targetId) =>
          edge(entity.id, "prerequisite_question", targetId)
        ),
        ...entity.successor_questions.map((targetId) =>
          edge(entity.id, "successor_question", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "historical_note":
      return [
        ...entity.subjects.map((targetId) =>
          edge(entity.id, "historical_context_for", targetId)
        ),
        ...entity.developed_from.map((targetId) =>
          edge(entity.id, "developed_from", targetId)
        ),
        ...entity.developed_into.map((targetId) =>
          edge(entity.id, "developed_into", targetId)
        ),
        ...sourceReferenceEdges(entity.id, entity.source_refs),
      ];

    case "source":
      return [];
  }
}

function sourceReferenceEdges(
  from: EntityId,
  references: readonly SourceReference[],
): GraphEdge[] {
  return references.map((reference) =>
    edge(from, "source_ref", reference.source)
  );
}

function edge(
  from: EntityId,
  relation: GraphRelation,
  to: EntityId,
): GraphEdge {
  return {
    from,
    relation,
    to,
  };
}

function compareEntities(
  left: GraphEntity,
  right: GraphEntity,
): number {
  return left.id.localeCompare(right.id);
}

function compareEdges(left: GraphEdge, right: GraphEdge): number {
  return (
    left.from.localeCompare(right.from) ||
    left.relation.localeCompare(right.relation) ||
    left.to.localeCompare(right.to)
  );
}
