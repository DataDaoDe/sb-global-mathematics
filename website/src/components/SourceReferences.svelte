<script lang="ts">
  import type { EntitySummary, SourceReference } from "../types";

  type Props = {
    readonly references: readonly SourceReference[] | undefined;
    readonly index: readonly EntitySummary[];
    readonly compact?: boolean;
  };

  let { references, index, compact = false }: Props = $props();
  const visibleReferences = $derived(references ?? []);

  function titleFor(sourceId: string): string {
    return index.find((entity) => entity.id === sourceId)?.title ?? sourceId;
  }
</script>

{#if visibleReferences.length > 0}
  <section class:article-section={!compact} class="source-reference-section">
    {#if !compact}
      <h2>Citations</h2>
    {/if}
    <div class="source-reference-list">
      {#each visibleReferences as reference}
        <article class="source-reference">
          <a href={`/e/${reference.source}`}>{titleFor(reference.source)}</a>
          {#if reference.locator}
            <span>{reference.locator}</span>
          {/if}
          {#if reference.note}
            <p>{reference.note}</p>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}
