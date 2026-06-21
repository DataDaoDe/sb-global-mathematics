<script lang="ts">
  import TreeNode from "./TreeNode.svelte";
  import type { SiteData } from "../types";

  type Props = {
    readonly siteData: SiteData;
  };

  let { siteData }: Props = $props();
</script>

<main class="site-shell">
  <nav class="top-nav">
    <a href="/">Global Mathematics</a>
    <a href="/timeline">Timeline</a>
    <span>{siteData.metadata.entity_count} entities</span>
  </nav>

  <section class="tree-header">
    <p class="eyebrow">Mathematics Tree</p>
    <h1>Browse the namespace structure.</h1>
    <p class="lede">
      This tree shows the editorial hierarchy implied by entity identifiers.
      Mathematical relations remain on each entity page.
    </p>
  </section>

  <section class="tree-shell">
    <TreeNode node={siteData.tree.root} root />
  </section>
</main>
