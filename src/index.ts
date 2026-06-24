export {
  ARTIFACT_SCHEMA_VERSION,
  createArtifactMetadata,
} from "./artifacts/metadata.js";

export type {
  ArtifactMetadata,
} from "./artifacts/metadata.js";

export {
  EntityIdSchema,
  isEntityId,
  parseEntityId,
} from "./domain/entity-id.js";

export type {
  EntityId,
} from "./domain/entity-id.js";

export {
  EntityKindSchema,
} from "./domain/entity-kind.js";

export type {
  EntityKind,
} from "./domain/entity-kind.js";

export {
  DisplayMathExpressionSchema,
  DisplayMathSchema,
} from "./domain/display-math.js";

export type {
  DisplayMath,
  DisplayMathExpression,
} from "./domain/display-math.js";

export {
  SourceReferenceLocatorSchema,
  SourceReferenceNoteSchema,
  SourceReferenceSchema,
  SourceReferencesSchema,
} from "./domain/source-reference.js";

export type {
  SourceReference,
} from "./domain/source-reference.js";

export {
  EntityBaseSchema,
  EntityTitleSchema,
} from "./domain/entity-base.js";

export type {
  EntityBase,
} from "./domain/entity-base.js";

export {
  ConceptSchema,
  ConceptSummarySchema,
  isConcept,
  parseConcept,
} from "./domain/concept.js";

export type {
  Concept,
} from "./domain/concept.js";

export {
  CounterexampleDescriptionSchema,
  CounterexampleSchema,
  isCounterexample,
  parseCounterexample,
} from "./domain/counterexample.js";

export type {
  Counterexample,
} from "./domain/counterexample.js";

export {
  DefinitionSchema,
  DefinitionStatementSchema,
  isDefinition,
  parseDefinition,
} from "./domain/definition.js";

export type {
  Definition,
} from "./domain/definition.js";

export {
  ExampleDescriptionSchema,
  ExampleSchema,
  isExample,
  parseExample,
} from "./domain/example.js";

export type {
  Example,
} from "./domain/example.js";

export {
  HistoricalNoteDateLabelSchema,
  HistoricalNoteDevelopmentTextSchema,
  HistoricalNoteDescriptionSchema,
  HistoricalNoteSchema,
  HistoricalNoteSummarySchema,
  isHistoricalNote,
  parseHistoricalNote,
} from "./domain/historical-note.js";

export type {
  HistoricalNote,
} from "./domain/historical-note.js";

export {
  ProofArgumentSchema,
  ProofMethodSchema,
  ProofSchema,
  isProof,
  parseProof,
} from "./domain/proof.js";

export type {
  Proof,
} from "./domain/proof.js";

export {
  PropositionClaimSchema,
  PropositionSchema,
  PropositionTypeSchema,
  isProposition,
  parseProposition,
} from "./domain/proposition.js";

export type {
  Proposition,
} from "./domain/proposition.js";

export {
  QuestionSchema,
  QuestionTextSchema,
  isQuestion,
  parseQuestion,
} from "./domain/question.js";

export type {
  Question,
} from "./domain/question.js";

export {
  PersonSchema,
  PersonSortNameSchema,
  isPerson,
  parsePerson,
} from "./domain/person.js";

export type {
  Person,
} from "./domain/person.js";

export {
  SourceDoiSchema,
  SourceIsbnSchema,
  SourceSchema,
  SourceTypeSchema,
  isSource,
  parseSource,
} from "./domain/source.js";

export type {
  Source,
} from "./domain/source.js";

export {
  buildGraph,
} from "./graph/build-graph.js";

export type {
  GraphArtifact,
  GraphEdge,
  GraphEntity,
  GraphRelation,
} from "./graph/build-graph.js";

export {
  exportSqlite,
} from "./sqlite/export-sqlite.js";

export type {
  SqliteExportMetadata,
} from "./sqlite/export-sqlite.js";

export {
  buildWebData,
} from "./web-data/build-web-data.js";

export type {
  WebDataBundle,
  WebEntityPage,
  WebEntitySummary,
  WebNamespaceTree,
  WebNamespaceTreeNode,
  WebSearchEntry,
} from "./web-data/build-web-data.js";

export {
  EntitySchemas,
  UnsupportedEntityKindError,
  isSupportedEntityKind,
  parseMathematicalEntity,
} from "./domain/mathematical-entity.js";

export type {
  MathematicalEntity,
  SupportedEntityKind,
} from "./domain/mathematical-entity.js";

export {
  loadEntityFile,
} from "./repository/load-entity-file.js";

export {
  discoverEntityFiles,
} from "./repository/discover-entity-files.js";

export {
  expectedEntityPath,
  relativeEntityPath,
} from "./repository/entity-path.js";

export {
  loadRepositoryEntities,
  validateEntities,
  validateRepository,
} from "./repository/validation.js";

export type {
  LoadedEntity,
  RepositoryValidationIssue,
  RepositoryValidationIssueCode,
  RepositoryValidationResult,
} from "./repository/validation.js";

export {
  MATHEMATICS_ROOT,
  REPOSITORY_ROOT,
  mathematicsPath,
} from "./repository/paths.js";

export const repositoryName = "global-mathematics";
