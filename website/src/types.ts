export type EntityKind =
  | "concept"
  | "definition"
  | "proposition"
  | "proof"
  | "example"
  | "counterexample"
  | "question"
  | "historical_note"
  | "source";

export type DisplayMath = {
  readonly latex: string;
  readonly description?: string;
};

export type SourceReference = {
  readonly source: string;
  readonly locator?: string;
  readonly note?: string;
};

export type Entity = {
  readonly id: string;
  readonly kind: EntityKind;
  readonly title: string;
  readonly display_math?: readonly DisplayMath[];
  readonly source_refs?: readonly SourceReference[];
  readonly [key: string]: unknown;
};

export type Edge = {
  readonly from: string;
  readonly relation: string;
  readonly to: string;
};

export type EntitySummary = {
  readonly id: string;
  readonly kind: EntityKind;
  readonly title: string;
};

export type SearchEntry = EntitySummary & {
  readonly text: string;
};

export type HistoryEntry = {
  readonly entity: Entity & {
    readonly kind: "historical_note";
    readonly date_label: string;
    readonly description: string;
    readonly developed_from?: readonly string[];
    readonly developed_into?: readonly string[];
  };
  readonly developed_from: readonly EntitySummary[];
  readonly developed_into: readonly EntitySummary[];
};

export type DefinitionEntry = {
  readonly entity: Entity & {
    readonly kind: "definition";
    readonly statement: string;
    readonly definition_role: string;
    readonly definition_style: string;
    readonly scope?: string;
    readonly equivalent_to?: readonly string[];
  };
  readonly equivalent_to: readonly EntitySummary[];
};

export type CitationBacklink = SourceReference & {
  readonly entity: EntitySummary;
};

export type NamespaceTreeNode = {
  readonly path: string;
  readonly label: string;
  readonly depth: number;
  readonly counts: Record<string, number>;
  readonly entities: readonly EntitySummary[];
  readonly children: readonly NamespaceTreeNode[];
};

export type NamespaceTree = {
  readonly root: NamespaceTreeNode;
};

export type EntityPage = {
  readonly entity: Entity;
  readonly outgoing: readonly Edge[];
  readonly incoming: readonly Edge[];
  readonly relations: Record<string, readonly EntitySummary[]>;
  readonly definitions: readonly DefinitionEntry[];
  readonly history: readonly HistoryEntry[];
  readonly citation_backlinks: readonly CitationBacklink[];
};

export type Metadata = {
  readonly schema_version: number;
  readonly generated_at: string;
  readonly entity_count: number;
  readonly edge_count: number;
};

export type SiteData = {
  readonly metadata: Metadata;
  readonly index: readonly EntitySummary[];
  readonly search: readonly SearchEntry[];
  readonly tree: NamespaceTree;
};
