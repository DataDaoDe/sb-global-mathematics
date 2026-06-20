<script lang="ts">
  import { renderProseMath } from "../lib/math";

  type Props = {
    readonly text: string;
    readonly className?: string;
  };

  let { text, className = "" }: Props = $props();
  let rendered = $derived(renderProseMath(text));
</script>

<p class={className}>{@html rendered}</p>
