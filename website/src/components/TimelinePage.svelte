<script lang="ts">
  import EntityLink from "./EntityLink.svelte";
  import SourceReferences from "./SourceReferences.svelte";
  import TextMath from "./TextMath.svelte";
  import type { SiteData, TimelineEntry } from "../types";

  type Props = {
    readonly siteData: SiteData;
  };

  let { siteData }: Props = $props();

  function dateRange(entry: TimelineEntry): string {
    if (entry.entity.end_year === undefined) {
      return String(entry.entity.start_year);
    }

    if (entry.entity.end_year === entry.entity.start_year) {
      return String(entry.entity.start_year);
    }

    return `${entry.entity.start_year}-${entry.entity.end_year}`;
  }

  function eventLabel(value: string): string {
    return value.replaceAll("_", " ");
  }
</script>

<main class="site-shell">
  <nav class="top-nav">
    <a href="/">Global Mathematics</a>
    <a href="/tree">Tree</a>
    <span>{siteData.timeline.length} historical entries</span>
  </nav>

  <section class="timeline-header">
    <p class="eyebrow">Historical Notes</p>
    <h1>Source-backed development notes.</h1>
    <p class="lede">
      This is a chronological projection of the graph, not the primary learning
      path. Use entity pages for concepts, definitions, examples, propositions,
      and proofs.
    </p>
  </section>

  <section class="timeline-list">
    {#each siteData.timeline as entry}
      <article class="timeline-entry">
        <div class="timeline-date">
          <strong>{dateRange(entry)}</strong>
          <span>{eventLabel(entry.entity.event_type)}</span>
        </div>

        <div class="timeline-body">
          <header>
            <span>{entry.entity.date_label}</span>
            <a href={`/e/${entry.entity.id}`}>{entry.entity.title}</a>
          </header>

          {#if entry.entity.summary}
            <TextMath className="entity-prose timeline-summary" text={entry.entity.summary} />
          {/if}

          {#if entry.entity.conceptual_change}
            <div class="timeline-development">
              <h2>Conceptual Change</h2>
              <TextMath className="entity-prose" text={entry.entity.conceptual_change} />
            </div>
          {/if}

          <SourceReferences
            references={entry.entity.source_refs}
            index={siteData.index}
            compact
          />

          {#if entry.subjects.length > 0}
            <div class="timeline-relations">
              <h2>Subjects</h2>
              <div class="entry-list">
                {#each entry.subjects as entity}
                  <EntityLink {entity} compact />
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </article>
    {/each}
  </section>
</main>
