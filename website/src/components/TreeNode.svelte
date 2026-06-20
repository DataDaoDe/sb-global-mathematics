<script lang="ts">
  import EntityLink from "./EntityLink.svelte";
  import TreeNode from "./TreeNode.svelte";
  import type { NamespaceTreeNode } from "../types";

  type Props = {
    readonly node: NamespaceTreeNode;
    readonly root?: boolean;
  };

  let { node, root = false }: Props = $props();
  const countPairs = $derived(Object.entries(node.counts));
  const hasChildren = $derived(node.children.length > 0);
  const hasEntities = $derived(node.entities.length > 0);
  const initiallyOpen = $derived(root || node.depth < 2);
</script>

<div class:root class="tree-node">
  {#if hasChildren}
    <details open={initiallyOpen}>
      <summary>
        <span class="tree-label">{node.label}</span>
        {#if node.path}
          <code>{node.path}</code>
        {/if}
        <span class="tree-counts">
          {#each countPairs as [kind, count]}
            <span>{count} {kind}</span>
          {/each}
        </span>
      </summary>

      {#if hasEntities}
        <div class="tree-entities">
          {#each node.entities as entity}
            <EntityLink {entity} compact />
          {/each}
        </div>
      {/if}

      <div class="tree-children">
        {#each node.children as child}
          <TreeNode node={child} />
        {/each}
      </div>
    </details>
  {:else}
    <div class="tree-leaf">
      <div class="tree-leaf-heading">
        <span class="tree-label">{node.label}</span>
        <code>{node.path}</code>
        <span class="tree-counts">
          {#each countPairs as [kind, count]}
            <span>{count} {kind}</span>
          {/each}
        </span>
      </div>

      {#if hasEntities}
        <div class="tree-entities">
          {#each node.entities as entity}
            <EntityLink {entity} compact />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
