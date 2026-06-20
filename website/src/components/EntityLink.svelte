<script lang="ts">
  import type { EntitySummary } from "../types";

  type Props = {
    readonly entity: EntitySummary;
    readonly compact?: boolean;
  };

  let { entity, compact = false }: Props = $props();
</script>

<a class:compact class="entity-link" href={`/e/${entity.id}`}>
  <span class="kind">{entity.kind}</span>
  <span class="title">{entity.title}</span>
  <code>{entity.id}</code>
</a>
