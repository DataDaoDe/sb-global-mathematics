# Global Mathematics

Global Mathematics is an open, structured repository of mathematical knowledge.

It models mathematics as a typed knowledge graph containing concepts, definitions, propositions, proofs, examples, counterexamples, and explicit relations between them.

The repository is designed to be used by and integrated into **Socrates Academy**, while remaining independently reusable by other mathematical and educational software.

## Purpose

Mathematical knowledge is scattered across textbooks, papers, lecture notes, proof assistants, and personal notes. Definitions and theorems are repeatedly duplicated without stable identifiers or explicit dependency information.

Global Mathematics provides a shared foundation in which mathematical entities can be defined once and referenced elsewhere.

For example:

```text
algebra.ring.commutative-unital
```

A book, paper, course, or learning package can reference this concept without redefining it.

## Core principles

* Mathematics is represented independently of courses and textbooks.
* Every mathematical entity has a stable, precise identifier.
* Mathematical relationships and dependencies are explicit.
* Source files are human-readable and stored in version control.
* Repository contents are validated deterministically.
* Formal definitions and proofs may be attached where available.
* Incorrect mathematics is corrected directly, even when this breaks dependent content.
* Unnecessary infrastructure and compatibility mechanisms are avoided.

## Scope

The global repository stores mathematical knowledge:

* concepts;
* definitions;
* propositions;
* theorems and lemmas;
* proofs;
* examples;
* counterexamples;
* constructions;
* dependencies;
* formalizations;
* sources and provenance;
* motivating questions;
* historical development.

It does not store:

* exercises;
* course sequences;
* learner progress;
* review schedules;
* personal notes or attempts.

These belong to Socrates Academy or other systems that consume the repository.

## Entity model

The initial entity types are:

```text
Concept
Definition
Proposition
Proof
Example
Counterexample
Question
Source
```

### Concept

A concept identifies a mathematical notion independently of its definitions, proofs, examples, or exposition.

```yaml
id: algebra.ring.commutative-unital
kind: concept
title: Commutative unital ring

summary: >
  An associative ring with a multiplicative identity
  whose multiplication is commutative.

defined_by:
  - algebra.ring.commutative-unital.definition

broader_concepts:
  - algebra.ring.associative-unital
```

### Definition

A definition introduces or characterizes one or more concepts.

### Proposition

A proposition represents a mathematical claim. It may be classified as a theorem, lemma, proposition, or corollary.

### Proof

A proof is stored separately from the proposition it proves. This allows several proofs, methods, and formalizations of the same result.

### Example

An example identifies a concrete mathematical object satisfying or illustrating a concept.

### Counterexample

A counterexample refutes a claim or demonstrates why an assumption is necessary.

### Question

A question records a mathematical inquiry that motivates concepts, definitions, propositions, examples, or counterexamples.

Questions are not exercises. They preserve why an idea exists and how someone might discover its role in the larger graph.

### Source

A source records bibliographic, historical, expository, or formal provenance for mathematical knowledge.

Sources support claims and historical context, but they do not by themselves make a mathematical statement correct.

## Identifiers

Entities use readable, lowercase, period-separated identifiers:

```text
algebra.group
algebra.group.definition
algebra.ring.commutative-unital
algebra.ideal.prime
analysis.function.continuous
```

Identifiers must:

* contain at least two segments;
* use lowercase ASCII;
* use periods between segments;
* use hyphens within segments when needed;
* contain no spaces, underscores, uppercase letters, or empty segments.

Different mathematical meanings receive different identifiers:

```text
algebra.ring.associative-unital
algebra.ring.associative-possibly-nonunital
```

## Repository architecture

```text
Mathematics source files
        ↓
Validation and build system
        ↓
Generated searchable database
        ↓
Socrates Academy and other applications
```

The source repository is authoritative. Generated databases and indexes are replaceable build artifacts.

Source content uses:

* YAML for structured metadata;
* Markdown for human-readable mathematics;
* KaTeX-compatible LaTeX for display mathematics;
* optional formal-language files for verified definitions and proofs.

Mathematical entities must include `display_math`, a non-empty list of renderable LaTeX expressions with optional descriptions:

```yaml
display_math:
  - latex: '\forall a,b \in R,\; ab = ba'
    description: Multiplication is commutative.
```

This field is for browser and app rendering. It is distinct from future proof-assistant formalizations.

Text fields may also contain renderable math:

* inline math uses single-dollar delimiters, as in `Let $f(x)=x^2$`;
* block math uses double-dollar delimiters, as in `$$f'(x)=2x$$`;
* literal dollar signs should be escaped.

Repository validation renders both forms with KaTeX.

Example structure:

```text
mathematics/
└── algebra/
    └── ring/
        └── commutative-unital/
            ├── concept.yaml
            ├── definition/
            ├── examples/
            └── propositions/
```

Entity paths are derived from entity IDs:

```text
algebra.ring.commutative-unital
  → mathematics/algebra/ring/commutative-unital/concept.yaml

algebra.ring.commutative-unital.definition
  → mathematics/algebra/ring/commutative-unital/definition.yaml

algebra.ring.commutative-unital.question.generalize-integer-arithmetic
  → mathematics/algebra/ring/commutative-unital/questions/generalize-integer-arithmetic.yaml

algebra.ring.commutative-unital.example.integers
  → mathematics/algebra/ring/commutative-unital/examples/integers.yaml

algebra.ring.commutative-unital.counterexample.matrix-ring-m2-real
  → mathematics/algebra/ring/commutative-unital/counterexamples/matrix-ring-m2-real.yaml

algebra.ring.commutative-unital.proposition.specializes-associative-unital
  → mathematics/algebra/ring/commutative-unital/propositions/specializes-associative-unital.yaml

algebra.ring.commutative-unital.proposition.specializes-associative-unital.proof.direct-from-definition
  → mathematics/algebra/ring/commutative-unital/propositions/specializes-associative-unital/proofs/direct-from-definition.yaml

source.dummit-foote-abstract-algebra-third-edition
  → mathematics/sources/dummit-foote-abstract-algebra-third-edition.yaml
```

## Validation

The repository will validate:

* entity schemas;
* identifier uniqueness;
* reference resolution;
* relation validity;
* concept-definition consistency;
* display and inline math rendering;
* baseline entity completeness;
* source citation locators;
* dependency graphs;
* invalid cycles;
* formal artifacts where available.

Baseline completeness currently requires:

* every concept to have at least one example;
* every concept to connect to a motivating or related question;
* every concept to have historical context;
* every definition, proposition, proof, example, counterexample, question, and historical note to cite at least one source;
* every source reference to include a locator.

Source references are structured citation objects:

```yaml
source_refs:
  - source: source.dummit-foote-abstract-algebra-third-edition
    locator: Chapter 7
    note: Standard abstract algebra treatment of rings.
```

Source entities may also include optional `doi` and `isbn` identifiers.

Structured fields generate graph relations automatically. For example:

```text
Definition ──defines──────► Concept
Proof ──────proves───────► Proposition
Example ────example-of───► Concept
Concept ────specializes──► Concept
Question ───motivates────► Entity
Entity ─────source-ref───► Source
```

## Testing

Tests should use concrete mathematical entities from the repository whenever loading infrastructure exists.

Synthetic objects should be limited to targeted invalid cases such as:

* malformed identifiers;
* missing fields;
* duplicate references;
* self-reference;
* unknown properties;
* unsupported entity kinds.

Both static and runtime validation are required:

```bash
pnpm build
pnpm build:website
pnpm check
pnpm test
pnpm validate
pnpm build:graph
pnpm build:sqlite
pnpm build:web-data
```

## Technology

The initial implementation uses:

* TypeScript;
* Node.js;
* Zod;
* YAML;
* Vitest;
* pnpm.

The project remains a single TypeScript repository until concrete requirements justify additional infrastructure.

## Current status

Implemented:

* validated mathematical entity identifiers;
* shared entity base schema;
* entity-kind validation;
* `Concept` schema;
* `Definition` schema;
* `Proposition` schema;
* `Proof` schema;
* `Example` schema;
* `Counterexample` schema;
* `Question` schema;
* `HistoricalNote` schema;
* `Source` schema;
* shared display-math validation for renderable mathematical entities;
* YAML mathematical source files;
* repository path utilities;
* generic entity loading;
* repository entity discovery;
* repository-wide validation for duplicate IDs, reference resolution, target kinds, path conventions, and concept-definition consistency;
* schema dispatch by entity kind;
* canonical JSON graph export;
* SQLite artifact export;
* static website data bundle export;
* static SvelteKit browser prototype;
* namespace tree browser route;
* tests using concrete repository content.

Currently supported:

```text
concept
counterexample
definition
example
historical_note
proof
proposition
question
source
```

Planned next:

1. add richer historical sources and person/terminology entities;
2. generate ontology exports;
3. refine static browser rendering;
4. integrate the repository with Socrates Academy.

## Development

Install dependencies:

```bash
pnpm install
```

Run type checking:

```bash
pnpm check
```

Run tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```
