<script lang="ts">
  import EntityLink from "./EntityLink.svelte";
  import { searchEntries } from "../lib/search";
  import type { SiteData } from "../types";

  type Props = {
    readonly siteData: SiteData;
  };

  let { siteData }: Props = $props();
  let query = $state("");
  let results = $derived(searchEntries(siteData.search, query).slice(0, 12));
  let browseEntries = $derived(siteData.index.slice(0, 12));
</script>

<main class="site-shell">
  <nav class="top-nav">
    <a href="/">Global Mathematics</a>
    <a href="/tree">Tree</a>
  </nav>

  <section class="home-hero">
    <p class="eyebrow">Global Mathematics</p>
    <h1>A structured knowledge graph of mathematical ideas.</h1>
    <p class="lede">
      Search concepts, definitions, propositions, proofs, examples,
      counterexamples, sources, and motivating questions.
    </p>

    <label class="search-label" for="global-search">Search the graph</label>
    <input
      id="global-search"
      class="search-input"
      bind:value={query}
      type="search"
      autocomplete="off"
      placeholder="commutative ring, proof, integers..."
    />

    <div class="build-meta">
      <span>Schema {siteData.metadata.schema_version}</span>
      <span>{siteData.metadata.entity_count} entities</span>
      <span>{siteData.metadata.edge_count} edges</span>
    </div>
  </section>

  <section class="index-section">
    <div class="section-heading">
      <h2>{query.trim() ? "Search results" : "Browse the graph"}</h2>
      <p>
        {query.trim()
          ? `${results.length} visible matches`
          : "A compact entry point into the current build."}
      </p>
    </div>

    <div class="entry-list">
      {#each query.trim() ? results : browseEntries as entry}
        <EntityLink entity={entry} />
      {/each}
    </div>
  </section>
</main>
