<script lang="ts">
  import { renderDisplayMath } from "../lib/math";
  import TextMath from "./TextMath.svelte";
  import type { DisplayMath as DisplayMathType } from "../types";

  type Props = {
    readonly expression: DisplayMathType;
  };

  let { expression }: Props = $props();
  let rendered = $derived(renderDisplayMath(expression.latex));
</script>

<figure class="display-math">
  <div>{@html rendered}</div>
  {#if expression.description}
    <figcaption>
      <TextMath text={expression.description} />
    </figcaption>
  {/if}
</figure>
