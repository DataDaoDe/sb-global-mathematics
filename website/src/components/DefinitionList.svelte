<script lang="ts">
  import DisplayMath from "./DisplayMath.svelte";
  import EntityLink from "./EntityLink.svelte";
  import SourceReferences from "./SourceReferences.svelte";
  import TextMath from "./TextMath.svelte";
  import type { DefinitionEntry, EntitySummary } from "../types";

  type Props = {
    readonly definitions: readonly DefinitionEntry[];
    readonly index: readonly EntitySummary[];
  };

  let { definitions, index }: Props = $props();
  const primaryDefinitions = $derived(
    definitions.filter((entry) => entry.entity.definition_role === "primary"),
  );
  const otherDefinitions = $derived(
    definitions.filter((entry) => entry.entity.definition_role !== "primary"),
  );

  function roleLabel(role: string): string {
    return role.replaceAll("_", " ");
  }
</script>

{#if definitions.length > 0}
  <section class="article-section definition-list-section">
    <h2>Definitions</h2>

    <div class="definition-list">
      {#each primaryDefinitions as definition}
        <article class="definition-entry primary-definition">
          <header>
            <span>{roleLabel(definition.entity.definition_role)}</span>
            <a href={`/e/${definition.entity.id}`}>{definition.entity.title}</a>
          </header>
          <p class="definition-meta">
            {definition.entity.definition_style}
            {#if definition.entity.scope}
              · {definition.entity.scope}
            {/if}
          </p>
          <TextMath className="entity-prose" text={definition.entity.statement} />
          {#if definition.entity.display_math}
            <div class="math-stack">
              {#each definition.entity.display_math as expression}
                <DisplayMath {expression} />
              {/each}
            </div>
          {/if}
          <SourceReferences references={definition.entity.source_refs} {index} compact />
        </article>
      {/each}

      {#if otherDefinitions.length > 0}
        <div class="definition-subsection">
          <h3>Other Formulations</h3>
          {#each otherDefinitions as definition}
            <article class="definition-entry">
              <header>
                <span>{roleLabel(definition.entity.definition_role)}</span>
                <a href={`/e/${definition.entity.id}`}>{definition.entity.title}</a>
              </header>
              <p class="definition-meta">
                {definition.entity.definition_style}
                {#if definition.entity.scope}
                  · {definition.entity.scope}
                {/if}
              </p>
              <TextMath className="entity-prose" text={definition.entity.statement} />
              {#if definition.equivalent_to.length > 0}
                <div class="definition-equivalences">
                  <h4>Equivalent to</h4>
                  <div class="entry-list">
                    {#each definition.equivalent_to as entity}
                      <EntityLink {entity} compact />
                    {/each}
                  </div>
                </div>
              {/if}
              <SourceReferences references={definition.entity.source_refs} {index} compact />
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </section>
{/if}
