# Knowledge Graph Scope

Global Mathematics is the source repository for the mathematical knowledge graph used by Socrates Academy and other consumers.

Its goal is not only to record mathematical statements. It must also preserve the questions, sources, and historical development that make mathematical ideas intelligible.

## Core Goal

Global Mathematics records mathematical knowledge as stable, validated, source-controlled entities so tools can reference, explore, and explain mathematical ideas without redefining them.

A user should eventually be able to start from an entity such as `algebra.ring.commutative-unital` and answer:

* what the concept means;
* how it is defined;
* which concepts it depends on;
* which examples and counterexamples clarify it;
* which propositions use it;
* which questions motivated it;
* which sources discuss it;
* how related ideas developed historically.

## Graph Layers

The graph has four distinct layers. They are connected, but they must not be collapsed into one relation type.

### Mathematical graph

The mathematical graph records logical and structural relationships.

Examples:

* a definition defines a concept;
* a proof proves a proposition;
* an example illustrates a concept;
* a concept specializes another concept;
* a proposition depends on another proposition.

These relations support correctness, prerequisite tracing, proof navigation, and future learner modeling.

Mathematical entities must also include display mathematics: KaTeX-compatible LaTeX expressions suitable for browsers, apps, and generated views. Display mathematics is required for renderable mathematical nodes, but it is not the same as proof-assistant formalization.

### Source graph

The source graph records where claims, definitions, terminology, exposition, and historical information are documented.

Sources may include books, papers, manuscripts, lectures, encyclopedias, web pages, and formal libraries.

Sources may include optional external identifiers:

* `doi` for DOI-bearing papers, books, chapters, and datasets;
* `isbn` for books and editions with ISBN identifiers.

A source reference supports a claim. It does not by itself make the claim mathematically correct.

Source references must be structured citation objects:

```yaml
source_refs:
  - source: source.dummit-foote-abstract-algebra-third-edition
    locator: Chapter 7
    note: Standard abstract algebra treatment of rings.
```

The `source` field identifies the source entity. The `locator` field points to the relevant part of the source. The optional `note` explains why this source supports the entity.

### Question graph

The question graph records the problems and questions that motivate mathematical development.

Questions are not exercises. They represent inquiry paths such as:

* what structure generalizes integer arithmetic;
* when a construction is universal;
* which assumptions are necessary for a theorem;
* how one invariant distinguishes two objects.

Questions may motivate concepts, definitions, propositions, examples, and counterexamples.

The historical development of a question should be modeled with `HistoricalNote`
entities whose `subjects` include that question. Do not add separate timeline
fields directly to `Question` unless a concrete use case requires question
entities to be dated independently of historical evidence. This keeps one
timeline model for concepts, results, examples, sources, and guiding problems.

Question progression is modeled separately from historical chronology.
Questions may list:

* `prerequisite_questions` - earlier questions that make the present question intelligible;
* `successor_questions` - later questions naturally opened by the present question.

These links are pedagogical and conceptual. They must not be treated as
historical date evidence; historical timing remains source-backed through
`HistoricalNote`.

### Historical graph

The historical graph records development over time: emergence, naming, publication, generalization, formalization, and changes in terminology.

Historical relations must remain separate from mathematical dependency. An idea may historically precede another idea without being a mathematical prerequisite. A modern prerequisite may also have been formalized after the idea it helps explain.

Historical notes are evidence-backed development claims, not merely dated
annotations. Each note must make explicit what changed and why the change
matters. A historical note should identify the source evidence, the affected
entities, the earlier formulation, the conceptual change, the resulting
formulation, and the developments the change enabled.

Historical notes must be placeable on a timeline. Each historical note must include:

* `event_type` - one of `origin`, `publication`, `formalization`, `generalization`, `terminology`, `application`, or `synthesis`;
* `start_year` - the normalized year used for sorting and visual timeline placement;
* `end_year` - an optional inclusive end year for developments that span a period;
* `date_label` - the human-readable historical period or date label used in prose.
* `summary` - a concise statement of the historical development claim;
* `conceptual_change` - the precise mathematical or conceptual shift recorded by the note.

Historical notes may also include:

* `prior_formulation` - the earlier state of the idea or problem;
* `resulting_formulation` - the formulation that emerged from the change;
* `enabled_developments` - later uses, questions, or technical developments made possible by the change.

The normalized year fields support sorting and visual navigation. `date_label` remains the reader-facing label and may carry nuance such as "nineteenth-century abstraction" or "modern abstract algebra formulation."

## Initial Entity Types

The first coherent graph slice should support:

* `Concept` - a mathematical notion;
* `Definition` - a precise characterization of one or more concepts, including primary, equivalent, alternative, historical, and contextual formulations;
* `Proposition` - a mathematical claim;
* `Proof` - an argument proving one or more propositions;
* `Example` - a concrete case satisfying or illustrating an entity;
* `Counterexample` - a concrete case refuting an entity or showing why an assumption matters;
* `Question` - a motivating mathematical inquiry;
* `HistoricalNote` - a source-backed note about the development, formulation, terminology, or historical context of mathematical ideas;
* `Source` - a bibliographic, historical, or formal provenance record;
* `Person` - a named historical or contemporary contributor referenced by sources.

Later slices should add:

* `Terminology`;
* `Formalization`.

## Relation Semantics

Use precise fields instead of a generic dependency field.

Initial relation meanings:

* `defined_by`: a concept is defined by a definition;
* `defines`: a definition defines a concept;
* `equivalent_to`: a definition is mathematically equivalent to another definition of the same concept;
* `depends_on`: a definition uses prior mathematical entities;
* `proves`: a proof proves a proposition;
* `example_of`: an example illustrates an entity;
* `counterexample_to`: a counterexample refutes or fails to satisfy an entity;
* `demonstrates_necessity_of`: a counterexample shows why another entity or assumption matters;
* `motivates`: a question motivates an entity;
* `related_concepts`: a question is conceptually related to concepts;
* `prerequisite_questions`: a question depends pedagogically or conceptually on earlier questions;
* `successor_questions`: a question opens later questions in a progression;
* `historical_context_for`: a historical note gives context for an entity;
* `developed_from`: a historical note points to earlier ideas or examples involved in development;
* `developed_into`: a historical note points to later ideas or formalizations;
* `source_refs`: an entity is supported or documented by sources;
* `author_refs`: a source points to the people who authored it;
* `broader_concepts`: a concept specializes broader concepts.

Repository-wide validation must check that relation targets exist and have the expected entity kinds.

Repository-wide completeness validation must also enforce the baseline authoring standard:

* concepts must have at least one example;
* concepts must have exactly one primary definition;
* concepts must connect to a motivating or related question;
* concepts must have historical context;
* propositions must have at least one proof;
* proofs must list each proposition they prove in `depends_on`;
* proof-step dependencies must resolve to mathematical entities and must also appear in the proof's top-level `depends_on`;
* counterexamples must identify what necessity they demonstrate;
* question progression links must be reciprocal between `prerequisite_questions` and `successor_questions`;
* definitions, propositions, proofs, examples, counterexamples, questions, and historical notes must cite at least one source;
* people must cite at least one source for identity or biographical details;
* source references must include locators.

## Path Convention

Entity file paths must be derivable from entity IDs.

Initial path rules:

* `concept`: `mathematics/<id segments>/concept.yaml`;
* primary/simple `definition`: `mathematics/<concept id segments>/definition.yaml`;
* definition variant: `mathematics/<concept id segments>/definitions/<definition slug>.yaml`;
* concept-scoped `proposition`: `mathematics/<concept id segments>/propositions/<proposition slug>.yaml`;
* proposition-scoped `proof`: `mathematics/<concept id segments>/propositions/<proposition slug>/proofs/<proof slug>.yaml`;
* concept-scoped `example`: `mathematics/<concept id segments>/examples/<example slug>.yaml`;
* concept-scoped `counterexample`: `mathematics/<concept id segments>/counterexamples/<counterexample slug>.yaml`;
* concept-scoped `question`: `mathematics/<concept id segments>/questions/<question slug>.yaml`;
* concept-scoped `historical_note`: `mathematics/<concept id segments>/history/<history slug>.yaml`;
* `source`: `mathematics/sources/<source slug>.yaml`.

This convention makes the source repository navigable without needing a generated index.

## Definition Variants

Concepts may have multiple definition entities. This is required for concepts
such as `foundations.function`, where the assignment formulation and the
set-theoretic graph formulation are both important.

Every definition has:

* `definition_role`: `primary`, `equivalent`, `alternative`, `historical`, or `contextual`;
* `definition_style`: `formal`, `intuitive`, `constructive`, `axiomatic`, `categorical`, or `set-theoretic`;
* optional `scope`, describing the mathematical setting where the formulation is used;
* `equivalent_to`, for definitions equivalent to another definition of the same concept.

Each concept must list all of its definition entities in `defined_by`, and must
have exactly one definition with `definition_role: primary`.

Do not create separate concepts merely for different formulations of the same
mathematical idea. Create separate concepts only when the object has distinct
mathematical behavior, such as partial functions, multivalued functions, or
continuous functions.

## Generated Artifacts

The source YAML remains authoritative. Generated artifacts are replaceable outputs for consumers.

The first canonical export is JSON:

* `generated/entities.json`;
* `generated/edges.json`;
* `generated/graph.json`.

Future artifacts should be generated from the same normalized graph:

* RDF/OWL ontology;
* graph database import files;
* static website data bundles.

The initial SQLite export is:

* `generated/global-mathematics.sqlite`.

It stores normalized `entities`, `edges`, `display_math`, and `metadata` tables.

The initial static website data bundle is:

* `generated/web/metadata.json`;
* `generated/web/index.json`;
* `generated/web/search.json`;
* `generated/web/tree.json`;
* `generated/web/entities/<entity-id>.json`.

Each entity page includes the entity, raw incoming and outgoing edges, and presentation-friendly relation groups for browser rendering.

## Display Mathematics

Mathematical entities must include a non-empty `display_math` list.

Each expression has:

* `latex`: a KaTeX-compatible expression;
* `description`: optional accessible context for the expression.

Example:

```yaml
display_math:
  - latex: '\forall a,b \in R,\; ab = ba'
    description: Multiplication is commutative.
```

The field supports beautiful rendering and symbolic browsing. It must not be treated as a verified formalization.

Narrative text fields may include inline and block math:

* inline math: `Let $f(x)=x^2$`;
* block math: `$$f'(x)=2x$$`.

Repository validation must render embedded text math with KaTeX so broken expressions are caught before consumers display them.

## Annotated Proof Steps

Proof entities may include a `steps` list for detailed exposition. The top-level `argument` remains the concise proof summary, while `steps` records the line-by-line instructional structure.

Each proof step has:

* `label`: a short unique name for the step;
* `statement`: the mathematical assertion established or used at that step;
* `justification`: the reason the step is allowed, such as a definition, axiom, theorem, truth condition, or previously established proposition;
* `depends_on`: optional references to mathematical entities used by the step;
* `display_math`: optional KaTeX-compatible expressions local to the step.

Step dependencies are explanatory citations, not proof-assistant formal derivations. Repository validation must still resolve them, reject non-mathematical targets, and require them to be mirrored in the proof's top-level `depends_on` so graph navigation remains complete.

## Near-Term Definition of Done

The next useful product slice is complete when:

* concept, definition, proposition, proof, example, counterexample, question, historical note, and source entities can be loaded from YAML;
* each entity has strict local schema validation;
* renderable mathematical entities include display mathematics;
* the commutative unital ring concept has a definition entity;
* at least one motivating question and one source can be attached;
* tests cover concrete repository files and targeted invalid cases;
* repository-wide validation is defined as the next boundary rather than hidden inside local schemas.
