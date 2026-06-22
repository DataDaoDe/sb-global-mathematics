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

          {#if entry.entity.summary}
            <TextMath className="entity-prose history-summary" text={entry.entity.summary} />
          {/if}

          {#if entry.entity.conceptual_change}
            <div class="history-development">
              <h3>Conceptual change</h3>
              <TextMath className="entity-prose" text={entry.entity.conceptual_change} />
            </div>
          {:else}
            <TextMath className="entity-prose" text={entry.entity.description} />
          {/if}

          <details class="history-more">
            <summary>Development detail</summary>
            <div class="development-grid">
              {#if entry.entity.prior_formulation}
                <section>
                  <h3>Prior formulation</h3>
                  <TextMath className="entity-prose" text={entry.entity.prior_formulation} />
                </section>
              {/if}

              {#if entry.entity.resulting_formulation}
                <section>
                  <h3>Resulting formulation</h3>
                  <TextMath className="entity-prose" text={entry.entity.resulting_formulation} />
                </section>
              {/if}

              {#if entry.entity.enabled_developments?.length}
                <section>
                  <h3>Enabled developments</h3>
                  <ul>
                    {#each entry.entity.enabled_developments as development}
                      <li><TextMath className="entity-prose" text={development} /></li>
                    {/each}
                  </ul>
                </section>
              {/if}

              <section>
                <h3>Full note</h3>
                <TextMath className="entity-prose" text={entry.entity.description} />
              </section>
            </div>
          </details>

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
