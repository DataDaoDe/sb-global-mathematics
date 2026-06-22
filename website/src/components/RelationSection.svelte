<script lang="ts">
  import EntityLink from "./EntityLink.svelte";
  import type { EntitySummary } from "../types";

  type Props = {
    readonly title: string;
    readonly entities: readonly EntitySummary[];
  };

  let { title, entities }: Props = $props();
  const relationLabels: Record<string, string> = {
    defined_by: "Defined by",
    definitions: "Definitions",
    broader_concepts: "Broader concepts",
    dependencies: "Dependencies",
    examples: "Examples",
    counterexamples: "Counterexamples",
    propositions: "Propositions",
    proofs: "Proofs",
    motivating_questions: "Motivating questions",
    prerequisite_questions: "Prerequisite questions",
    successor_questions: "Successor questions",
    developed_from: "Developed from",
    developed_into: "Developed into",
    related_concepts: "Related concepts",
    sources: "Sources",
    necessity_targets: "Necessity targets",
  };

  const label = $derived(
    relationLabels[title] ?? title.replaceAll("_", " "),
  );
</script>

<section class="article-section">
  <h2>{label}</h2>
  <div class="entry-list">
    {#each entities as entity}
      <EntityLink {entity} />
    {/each}
  </div>
</section>
