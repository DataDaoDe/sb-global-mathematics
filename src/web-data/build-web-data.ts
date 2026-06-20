import type {
  GraphArtifact,
  GraphEdge,
  GraphEntity,
  GraphRelation,
} from "../graph/build-graph.js";
import type { ArtifactMetadata } from "../artifacts/metadata.js";
import type { SourceReference } from "../domain/source-reference.js";

export type WebEntitySummary = {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
};

export type WebEntityPage = {
  readonly entity: GraphEntity["data"];
  readonly outgoing: readonly GraphEdge[];
  readonly incoming: readonly GraphEdge[];
  readonly relations: Record<string, readonly WebEntitySummary[]>;
  readonly history: readonly WebHistoryEntry[];
  readonly citation_backlinks: readonly WebCitationBacklink[];
};

export type WebHistoryEntry = {
  readonly entity: Extract<GraphEntity["data"], { kind: "historical_note" }>;
  readonly developed_from: readonly WebEntitySummary[];
  readonly developed_into: readonly WebEntitySummary[];
};

export type WebCitationBacklink = SourceReference & {
  readonly entity: WebEntitySummary;
};

type HistoricalNoteGraphEntity = GraphEntity & {
  readonly data: Extract<GraphEntity["data"], { kind: "historical_note" }>;
};

export type WebSearchEntry = {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly text: string;
};

export type WebNamespaceTreeNode = {
  readonly path: string;
  readonly label: string;
  readonly depth: number;
  readonly counts: Record<string, number>;
  readonly entities: readonly WebEntitySummary[];
  readonly children: readonly WebNamespaceTreeNode[];
};

export type WebNamespaceTree = {
  readonly root: WebNamespaceTreeNode;
};

export type WebDataBundle = {
  readonly metadata: ArtifactMetadata;
  readonly pages: readonly WebEntityPage[];
  readonly index: readonly WebEntitySummary[];
  readonly search: readonly WebSearchEntry[];
  readonly tree: WebNamespaceTree;
};

const INCOMING_RELATION_GROUPS: Partial<
  Record<GraphRelation, string>
> = {
  defines: "definitions",
  example_of: "examples",
  counterexample_to: "counterexamples",
  proves: "proofs",
  motivates: "motivating_questions",
  historical_context_for: "history",
};

const OUTGOING_RELATION_GROUPS: Partial<
  Record<GraphRelation, string>
> = {
  defined_by: "defined_by",
  broader_concept: "broader_concepts",
  depends_on: "dependencies",
  source_ref: "sources",
  related_concept: "related_concepts",
  demonstrates_necessity_of: "necessity_targets",
  developed_from: "developed_from",
  developed_into: "developed_into",
};

export function buildWebData(graph: GraphArtifact): WebDataBundle {
  const entitiesById = new Map(
    graph.entities.map((entity) => [entity.id, entity]),
  );

  const pages = graph.entities.map((entity) =>
    buildEntityPage(entity, graph.edges, entitiesById)
  );

  return {
    metadata: graph.metadata,
    pages,
    index: graph.entities.map(toSummary),
    search: graph.entities.map(toSearchEntry),
    tree: buildNamespaceTree(graph.entities),
  };
}

function buildNamespaceTree(
  entities: readonly GraphEntity[],
): WebNamespaceTree {
  const root = createMutableTreeNode("", "Mathematics", 0);

  for (const entity of entities) {
    addEntityToTree(root, entity);
  }

  return {
    root: freezeTreeNode(root),
  };
}

type MutableTreeNode = {
  path: string;
  label: string;
  depth: number;
  counts: Record<string, number>;
  entities: WebEntitySummary[];
  children: Map<string, MutableTreeNode>;
};

function createMutableTreeNode(
  path: string,
  label: string,
  depth: number,
): MutableTreeNode {
  return {
    path,
    label,
    depth,
    counts: {},
    entities: [],
    children: new Map(),
  };
}

function addEntityToTree(root: MutableTreeNode, entity: GraphEntity): void {
  incrementCount(root.counts, entity.kind);

  let current = root;
  const segments = entity.id.split(".");

  for (const [index, segment] of segments.entries()) {
    const path = segments.slice(0, index + 1).join(".");
    const existing = current.children.get(segment);
    const child = existing ??
      createMutableTreeNode(path, namespaceLabel(segment), index + 1);

    if (existing === undefined) {
      current.children.set(segment, child);
    }

    incrementCount(child.counts, entity.kind);
    current = child;
  }

  current.entities.push(toSummary(entity));
}

function incrementCount(
  counts: Record<string, number>,
  kind: string,
): void {
  counts[kind] = (counts[kind] ?? 0) + 1;
}

function freezeTreeNode(node: MutableTreeNode): WebNamespaceTreeNode {
  return {
    path: node.path,
    label: node.label,
    depth: node.depth,
    counts: sortCounts(node.counts),
    entities: node.entities.sort(compareSummaries),
    children: [...node.children.values()]
      .sort(compareTreeNodes)
      .map(freezeTreeNode),
  };
}

function sortCounts(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(counts).sort(([leftKind], [rightKind]) =>
      leftKind.localeCompare(rightKind)
    ),
  );
}

function compareTreeNodes(
  left: MutableTreeNode,
  right: MutableTreeNode,
): number {
  return left.path.localeCompare(right.path);
}

function namespaceLabel(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildEntityPage(
  entity: GraphEntity,
  edges: readonly GraphEdge[],
  entitiesById: ReadonlyMap<string, GraphEntity>,
): WebEntityPage {
  const outgoing = edges.filter((edge) => edge.from === entity.id);
  const incoming = edges.filter((edge) => edge.to === entity.id);

  return {
    entity: entity.data,
    outgoing,
    incoming,
    relations: groupRelations(outgoing, incoming, entitiesById),
    history: buildHistoryEntries(incoming, entitiesById),
    citation_backlinks: buildCitationBacklinks(entity, entitiesById),
  };
}

function buildHistoryEntries(
  incoming: readonly GraphEdge[],
  entitiesById: ReadonlyMap<string, GraphEntity>,
): readonly WebHistoryEntry[] {
  return incoming
    .filter((edge) => edge.relation === "historical_context_for")
    .map((edge) => entitiesById.get(edge.from))
    .filter((entity): entity is HistoricalNoteGraphEntity =>
      entity !== undefined && entity.data.kind === "historical_note"
    )
    .map((entity) => {
      const note = entity.data;

      return {
        entity: note,
        developed_from: note.developed_from
          .map((id) => entitiesById.get(id))
          .filter(isDefined)
          .map(toSummary)
          .sort(compareSummaries),
        developed_into: note.developed_into
          .map((id) => entitiesById.get(id))
          .filter(isDefined)
          .map(toSummary)
          .sort(compareSummaries),
      };
    })
    .sort((left, right) => left.entity.id.localeCompare(right.entity.id));
}

function buildCitationBacklinks(
  source: GraphEntity,
  entitiesById: ReadonlyMap<string, GraphEntity>,
): readonly WebCitationBacklink[] {
  if (source.kind !== "source") {
    return [];
  }

  return [...entitiesById.values()]
    .flatMap((entity) =>
      sourceReferencesFor(entity)
        .filter((reference) => reference.source === source.id)
        .map((reference) => ({
          ...reference,
          entity: toSummary(entity),
        }))
    )
    .sort(compareCitationBacklinks);
}

function sourceReferencesFor(
  entity: GraphEntity,
): readonly SourceReference[] {
  const { data } = entity;

  switch (data.kind) {
    case "definition":
    case "proposition":
    case "proof":
    case "example":
    case "counterexample":
    case "question":
    case "historical_note":
      return data.source_refs;
    case "concept":
    case "source":
      return [];
  }
}

function groupRelations(
  outgoing: readonly GraphEdge[],
  incoming: readonly GraphEdge[],
  entitiesById: ReadonlyMap<string, GraphEntity>,
): Record<string, readonly WebEntitySummary[]> {
  const groups = new Map<string, WebEntitySummary[]>();

  for (const edge of outgoing) {
    const groupName = OUTGOING_RELATION_GROUPS[edge.relation];

    if (groupName !== undefined) {
      addGroupedEntity(groups, groupName, edge.to, entitiesById);
    }
  }

  for (const edge of incoming) {
    const groupName = INCOMING_RELATION_GROUPS[edge.relation];

    if (groupName !== undefined) {
      addGroupedEntity(groups, groupName, edge.from, entitiesById);
    }
  }

  return Object.fromEntries(
    [...groups.entries()].map(([groupName, entities]) => [
      groupName,
      entities.sort(compareSummaries),
    ]),
  );
}

function addGroupedEntity(
  groups: Map<string, WebEntitySummary[]>,
  groupName: string,
  entityId: string,
  entitiesById: ReadonlyMap<string, GraphEntity>,
): void {
  const entity = entitiesById.get(entityId);

  if (entity === undefined) {
    return;
  }

  const group = groups.get(groupName) ?? [];
  group.push(toSummary(entity));
  groups.set(groupName, group);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function toSummary(entity: GraphEntity): WebEntitySummary {
  return {
    id: entity.id,
    kind: entity.kind,
    title: entity.title,
  };
}

function toSearchEntry(entity: GraphEntity): WebSearchEntry {
  return {
    id: entity.id,
    kind: entity.kind,
    title: entity.title,
    text: searchableText(entity),
  };
}

function searchableText(entity: GraphEntity): string {
  const { data } = entity;

  switch (data.kind) {
    case "concept":
      return `${data.title}\n${data.summary}`;
    case "definition":
      return `${data.title}\n${data.statement}`;
    case "proposition":
      return `${data.title}\n${data.claim}`;
    case "proof":
      return `${data.title}\n${data.method}\n${data.argument}`;
    case "example":
      return `${data.title}\n${data.description}`;
    case "counterexample":
      return `${data.title}\n${data.description}`;
    case "question":
      return `${data.title}\n${data.asks}`;
    case "historical_note":
      return `${data.title}\n${data.date_label}\n${data.description}`;
    case "source":
      return `${data.title}\n${data.authors.join("\n")}`;
  }
}

function compareSummaries(
  left: WebEntitySummary,
  right: WebEntitySummary,
): number {
  return left.id.localeCompare(right.id);
}

function compareCitationBacklinks(
  left: WebCitationBacklink,
  right: WebCitationBacklink,
): number {
  return (left.locator ?? "").localeCompare(right.locator ?? "") ||
    left.entity.id.localeCompare(right.entity.id);
}
