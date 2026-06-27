<script lang="ts">
  import { Handle, Position, type NodeProps } from "@xyflow/svelte";

  type GraphEntityNodeData = {
    label: string;
    kindLabel: string;
    count?: number;
  };

  let { data }: NodeProps = $props();
  const nodeData = $derived(data as GraphEntityNodeData);
</script>

<Handle type="target" position={Position.Top} class="graph-flow-handle" />
<div class="graph-flow-node-label">{nodeData.label}</div>
<div class="graph-flow-node-meta">
  {nodeData.kindLabel}{#if nodeData.count && nodeData.count > 1} · {nodeData.count}{/if}
</div>
<Handle type="source" position={Position.Bottom} class="graph-flow-handle" />
