<script lang="ts">
  import EntityLink from "./EntityLink.svelte";
  import type { CitationBacklink } from "../types";

  type CitationGroup = {
    readonly locator: string | undefined;
    readonly references: readonly CitationBacklink[];
  };

  type Props = {
    readonly backlinks: readonly CitationBacklink[];
  };

  let { backlinks }: Props = $props();
  const groups = $derived(groupByLocator(backlinks));

  function groupByLocator(
    references: readonly CitationBacklink[],
  ): readonly CitationGroup[] {
    const grouped = new Map<string, CitationBacklink[]>();

    for (const reference of references) {
      const key = reference.locator ?? "";
      const group = grouped.get(key) ?? [];
      group.push(reference);
      grouped.set(key, group);
    }

    return [...grouped.entries()]
      .map(([locator, group]) => ({
        locator: locator === "" ? undefined : locator,
        references: group.sort((left, right) =>
          left.entity.id.localeCompare(right.entity.id)
        ),
      }))
      .sort((left, right) =>
        (left.locator ?? "").localeCompare(right.locator ?? "")
      );
  }
</script>

{#if backlinks.length > 0}
  <section class="article-section citation-backlink-section">
    <h2>Cited By</h2>
    <div class="citation-backlink-groups">
      {#each groups as group}
        <article class="citation-backlink-group">
          <h3>{group.locator ?? "Unspecified locator"}</h3>
          <div class="entry-list">
            {#each group.references as reference}
              <div class="citation-backlink">
                <EntityLink entity={reference.entity} compact />
                {#if reference.note}
                  <p>{reference.note}</p>
                {/if}
              </div>
            {/each}
          </div>
        </article>
      {/each}
    </div>
  </section>
{/if}
