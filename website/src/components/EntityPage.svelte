<script lang="ts">
  import DisplayMath from "./DisplayMath.svelte";
  import CitationBacklinks from "./CitationBacklinks.svelte";
  import EntityDetails from "./EntityDetails.svelte";
  import EntityLink from "./EntityLink.svelte";
  import HistorySection from "./HistorySection.svelte";
  import RelationSection from "./RelationSection.svelte";
  import SourceReferences from "./SourceReferences.svelte";
  import TextMath from "./TextMath.svelte";
  import { loadEntityPage } from "../lib/data";
  import type { EntityPage as EntityPageData, SiteData } from "../types";

  type Props = {
    readonly id: string;
    readonly siteData: SiteData;
  };

  let { id, siteData }: Props = $props();
  let page = $state<EntityPageData | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    page = null;
    error = null;

    loadEntityPage(id)
      .then((loadedPage) => {
        page = loadedPage;
      })
      .catch((reason: unknown) => {
        error = reason instanceof Error ? reason.message : String(reason);
      });
  });

  const sectionOrder = [
    "defined_by",
    "definitions",
    "broader_concepts",
    "dependencies",
    "examples",
    "counterexamples",
    "propositions",
    "proofs",
    "motivating_questions",
    "developed_from",
    "developed_into",
    "related_concepts",
    "sources",
    "necessity_targets",
  ];
</script>

<main class="site-shell">
  <nav class="top-nav">
    <a href="/">Global Mathematics</a>
    <a href="/tree">Tree</a>
    <span>{siteData.metadata.entity_count} entities</span>
  </nav>

  {#if error}
    <section class="notice">
      <p class="eyebrow">Not found</p>
      <h1>Unable to load entity.</h1>
      <p>{error}</p>
    </section>
  {:else if page === null}
    <section class="notice">
      <p class="eyebrow">Loading</p>
      <h1>Opening entity…</h1>
    </section>
  {:else}
    <article class="entity-layout">
      <section class="entity-main">
        <header class="entity-header">
          <p class="eyebrow">{page.entity.kind}</p>
          <h1>{page.entity.title}</h1>
          <code>{page.entity.id}</code>
        </header>

        {#if page.entity.summary}
          <TextMath className="entity-prose lede" text={String(page.entity.summary)} />
        {/if}

        <EntityDetails entity={page.entity} />

        {#if page.entity.statement}
          <section class="article-section">
            <h2>Definition</h2>
            <TextMath className="entity-prose" text={String(page.entity.statement)} />
          </section>
        {/if}

        {#if page.entity.claim}
          <section class="article-section">
            <h2>Claim</h2>
            <TextMath className="entity-prose" text={String(page.entity.claim)} />
          </section>
        {/if}

        {#if page.entity.description}
          <section class="article-section">
            <h2>Description</h2>
            <TextMath className="entity-prose" text={String(page.entity.description)} />
          </section>
        {/if}

        {#if page.entity.asks}
          <section class="article-section">
            <h2>Question</h2>
            <TextMath className="entity-prose" text={String(page.entity.asks)} />
          </section>
        {/if}

        {#if page.entity.argument}
          <section class="article-section">
            <h2>Argument</h2>
            <TextMath className="entity-prose" text={String(page.entity.argument)} />
          </section>
        {/if}

        {#if page.entity.display_math}
          <section class="article-section">
            <h2>Display Mathematics</h2>
            <div class="math-stack">
              {#each page.entity.display_math as expression}
                <DisplayMath expression={expression} />
              {/each}
            </div>
          </section>
        {/if}

        <SourceReferences references={page.entity.source_refs} index={siteData.index} />
        <HistorySection entries={page.history} index={siteData.index} />
        <CitationBacklinks backlinks={page.citation_backlinks} />

        {#each sectionOrder as relationName}
          {#if page.relations[relationName]?.length}
            <RelationSection
              title={relationName}
              entities={page.relations[relationName]}
            />
          {/if}
        {/each}
      </section>

      <aside class="entity-rail">
        <section>
          <h2>Graph Neighborhood</h2>
          <p>{page.incoming.length} incoming relations</p>
          <p>{page.outgoing.length} outgoing relations</p>
        </section>

        <section>
          <h2>Nearby Entries</h2>
          <div class="rail-list">
            {#each [...page.incoming, ...page.outgoing].slice(0, 8) as edge}
              {@const targetId = edge.from === page.entity.id ? edge.to : edge.from}
              {@const target = siteData.index.find((entry) => entry.id === targetId)}
              {#if target}
                <EntityLink entity={target} compact />
              {/if}
            {/each}
          </div>
        </section>
      </aside>
    </article>
  {/if}
</main>
