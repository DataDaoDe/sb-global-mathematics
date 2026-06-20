<script lang="ts">
  import EntityLink from "./EntityLink.svelte";
  import SourceReferences from "./SourceReferences.svelte";
  import TextMath from "./TextMath.svelte";
  import type { EntitySummary, HistoryEntry } from "../types";

  type Props = {
    readonly entries: readonly HistoryEntry[];
    readonly index: readonly EntitySummary[];
  };

  let { entries, index }: Props = $props();
</script>

{#if entries.length > 0}
  <section class="article-section history-section">
    <h2>Historical Development</h2>
    <div class="history-list">
      {#each entries as entry}
        <article class="history-entry">
          <header>
            <span>{entry.entity.date_label}</span>
            <a href={`/e/${entry.entity.id}`}>{entry.entity.title}</a>
          </header>

          <TextMath className="entity-prose" text={entry.entity.description} />

          <SourceReferences
            references={entry.entity.source_refs}
            {index}
            compact
          />

          {#if entry.developed_from.length > 0}
            <div class="history-relations">
              <h3>Developed from</h3>
              <div class="entry-list">
                {#each entry.developed_from as entity}
                  <EntityLink {entity} compact />
                {/each}
              </div>
            </div>
          {/if}

          {#if entry.developed_into.length > 0}
            <div class="history-relations">
              <h3>Developed into</h3>
              <div class="entry-list">
                {#each entry.developed_into as entity}
                  <EntityLink {entity} compact />
                {/each}
              </div>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}
