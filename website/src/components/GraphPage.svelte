<script lang="ts">
  import {
    Background,
    BackgroundVariant,
    Controls,
    MarkerType,
    MiniMap,
    SvelteFlow,
    type Edge as FlowEdge,
    type Node as FlowNode,
  } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import type { Edge, EntityKind, EntitySummary, SiteData } from "../types";
  import GraphEntityNode from "./GraphEntityNode.svelte";

  type Props = {
    readonly siteData: SiteData;
  };

  type GraphMode = "overview" | "local";
  type RelationProfile = "learning" | "structure" | "history" | "all";

  type VisualNode = {
    readonly id: string;
    readonly title: string;
    readonly kind: EntityKind | "namespace";
    readonly count: number;
    readonly x: number;
    readonly y: number;
  };

  type VisualEdge = {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly relation: string;
    readonly count: number;
  };

  type VisualGraph = {
    readonly nodes: readonly VisualNode[];
    readonly edges: readonly VisualEdge[];
  };

  const nodeTypes = {
    entity: GraphEntityNode,
  };

  type FlowNodeData = {
    readonly label: string;
    readonly kindLabel: string;
    readonly count: number;
  };

  type FlowEdgeData = {
    readonly relation: string;
    readonly count: number;
  };

  const RELATION_PROFILES: Record<RelationProfile, readonly string[]> = {
    learning: [
      "defined_by",
      "depends_on",
      "proves",
      "example_of",
      "counterexample_to",
      "demonstrates_necessity_of",
      "prerequisite_question",
      "successor_question",
      "motivates",
    ],
    structure: [
      "broader_concept",
      "defines",
      "defined_by",
      "equivalent_to",
      "related_concept",
      "example_of",
      "counterexample_to",
    ],
    history: [
      "historical_context_for",
      "developed_from",
      "developed_into",
      "authored_by",
      "source_ref",
    ],
    all: [],
  };

  const NODE_KIND_LABELS: Record<VisualNode["kind"], string> = {
    namespace: "area",
    concept: "concept",
    definition: "definition",
    proposition: "theorem",
    proof: "proof",
    example: "example",
    counterexample: "counterexample",
    question: "question",
    historical_note: "history",
    source: "source",
    person: "person",
  };

  let { siteData }: Props = $props();

  const nodesById = $derived(
    new Map(siteData.graph.nodes.map((node) => [node.id, node])),
  );
  const topNamespaces = $derived(
    siteData.tree.root.children.map((child) => child.path),
  );
  const namespaceOptions = $derived(["all", ...topNamespaces]);

  let mode = $state<GraphMode>("overview");
  let profile = $state<RelationProfile>("learning");
  let namespace = $state("all");
  let query = $state("");
  let focusId = $state("foundations.relation");
  let depth = $state(2);
  let selectedId = $state<string | undefined>(undefined);

  const matchingEntities = $derived(
    siteData.search
      .filter((entry) => {
        const term = query.trim().toLowerCase();

        if (!term) {
          return false;
        }

        return entry.title.toLowerCase().includes(term) ||
          entry.id.toLowerCase().includes(term);
      })
      .slice(0, 8),
  );

  const graph = $derived(
    mode === "overview"
      ? buildOverviewGraph(siteData.graph.nodes, filteredEdges())
      : buildLocalGraph(focusId, depth, siteData.graph.nodes, filteredEdges()),
  );

  const flowNodes = $derived(
    graph.nodes.map((node) => visualNodeToFlowNode(node)),
  );

  const flowEdges = $derived(
    graph.edges.map((edge) => visualEdgeToFlowEdge(edge)),
  );

  const selectedNode = $derived(
    selectedId === undefined
      ? undefined
      : graph.nodes.find((node) => node.id === selectedId) ??
        nodesById.get(selectedId),
  );

  const selectedEdges = $derived(
    selectedId === undefined
      ? []
      : siteData.graph.edges
        .filter((edge) => edge.from === selectedId || edge.to === selectedId)
        .slice(0, 12),
  );

  const selectedProperties = $derived(
    selectedNode === undefined
      ? []
      : [
        ["id", selectedNode.id],
        ["kind", NODE_KIND_LABELS[selectedNode.kind]],
        ["title", selectedNode.title],
        selectedNode.kind === "namespace"
          ? ["entities", String(selectedNode.count)]
          : ["area", topNamespace(selectedNode.id)],
        ["visible degree", String(visibleDegree(selectedNode.id))],
        ["incoming", String(incomingEdgeCount(selectedNode.id))],
        ["outgoing", String(outgoingEdgeCount(selectedNode.id))],
      ],
  );

  function filteredEdges(): readonly Edge[] {
    const allowedRelations = RELATION_PROFILES[profile];

    return siteData.graph.edges.filter((edge) => {
      if (
        allowedRelations.length > 0 &&
        !allowedRelations.includes(edge.relation)
      ) {
        return false;
      }

      if (namespace === "all") {
        return true;
      }

      return edge.from.startsWith(`${namespace}.`) ||
        edge.to.startsWith(`${namespace}.`) ||
        edge.from === namespace ||
        edge.to === namespace;
    });
  }

  function chooseFocus(entity: EntitySummary): void {
    focusId = entity.id;
    selectedId = entity.id;
    mode = "local";
    query = "";
  }

  function selectNode(id: string): void {
    selectedId = id;

    if (mode === "local" && nodesById.has(id)) {
      focusId = id;
    }
  }

  function namespaceLabel(value: string): string {
    if (value === "all") {
      return "All areas";
    }

    return value
      .split(".")
      .at(-1)!
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function relationLabel(value: string): string {
    return value.replaceAll("_", " ");
  }

  function nodeClass(node: VisualNode): string {
    const classes = ["graph-flow-node", `graph-flow-node-${node.kind}`];

    if (node.id === selectedId || node.id === focusId) {
      classes.push("selected");
    }

    return classes.join(" ");
  }

  function visualNodeToFlowNode(
    node: VisualNode,
  ): FlowNode<FlowNodeData, "default"> {
    return {
      id: node.id,
      type: "entity",
      position: { x: node.x, y: node.y },
      data: {
        label: node.title,
        kindLabel: node.kind === "namespace"
          ? `${node.count} entities`
          : NODE_KIND_LABELS[node.kind],
        count: node.count,
      },
      class: nodeClass(node),
      draggable: false,
      selectable: true,
      focusable: true,
    };
  }

  function visualEdgeToFlowEdge(
    edge: VisualEdge,
  ): FlowEdge<FlowEdgeData, "smoothstep"> {
    return {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: "smoothstep",
      label: edge.count > 1
        ? `${relationLabel(edge.relation)} (${edge.count})`
        : relationLabel(edge.relation),
      data: {
        relation: edge.relation,
        count: edge.count,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#4b5552",
        width: 18,
        height: 18,
      },
      class: edge.count > 4 ? "strong-edge" : "",
      selectable: true,
      focusable: true,
      ariaLabel: `${edge.from} to ${edge.to}: ${relationLabel(edge.relation)}`,
      interactionWidth: 18,
    };
  }

  function visibleDegree(id: string): number {
    return graph.edges.filter((edge) => edge.from === id || edge.to === id).length;
  }

  function incomingEdgeCount(id: string): number {
    return siteData.graph.edges.filter((edge) => edge.to === id).length;
  }

  function outgoingEdgeCount(id: string): number {
    return siteData.graph.edges.filter((edge) => edge.from === id).length;
  }

  function edgeDirectionLabel(edge: Edge): string {
    return edge.from === selectedId ? "outgoing" : "incoming";
  }

  function buildOverviewGraph(
    nodes: readonly EntitySummary[],
    edges: readonly Edge[],
  ): VisualGraph {
    const namespaces = namespace === "all"
      ? topNamespaces
      : [namespace];
    const namespaceSet = new Set(namespaces);
    const counts = new Map<string, number>();

    for (const node of nodes) {
      const area = topNamespace(node.id);

      if (namespaceSet.has(area)) {
        counts.set(area, (counts.get(area) ?? 0) + 1);
      }
    }

    const visualNodes = namespaces
      .filter((area) => counts.has(area))
      .map((area, index, visibleNamespaces) => {
        const angle = (Math.PI * 2 * index) / visibleNamespaces.length -
          Math.PI / 2;
        const radius = visibleNamespaces.length <= 3 ? 210 : 265;

        return {
          id: area,
          title: namespaceLabel(area),
          kind: "namespace" as const,
          count: counts.get(area) ?? 0,
          x: 420 + Math.cos(angle) * radius,
          y: 310 + Math.sin(angle) * radius,
        };
      });

    const edgeCounts = new Map<string, VisualEdge>();

    for (const edge of edges) {
      const from = topNamespace(edge.from);
      const to = topNamespace(edge.to);

      if (from === to || !namespaceSet.has(from) || !namespaceSet.has(to)) {
        continue;
      }

      const id = `${from}:${to}:${edge.relation}`;
      const existing = edgeCounts.get(id);

      edgeCounts.set(id, {
        id,
        from,
        to,
        relation: edge.relation,
        count: (existing?.count ?? 0) + 1,
      });
    }

    return {
      nodes: visualNodes,
      edges: [...edgeCounts.values()].sort((left, right) =>
        right.count - left.count || left.id.localeCompare(right.id)
      ).slice(0, 64),
    };
  }

  function buildLocalGraph(
    rootId: string,
    maxDepth: number,
    nodes: readonly EntitySummary[],
    edges: readonly Edge[],
  ): VisualGraph {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const root = nodeIds.has(rootId) ? rootId : nodes[0]?.id;

    if (root === undefined) {
      return { nodes: [], edges: [] };
    }

    const adjacency = new Map<string, Set<string>>();

    for (const edge of edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        continue;
      }

      addAdjacent(adjacency, edge.from, edge.to);
      addAdjacent(adjacency, edge.to, edge.from);
    }

    const distances = new Map<string, number>([[root, 0]]);
    const queue = [root];

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      const currentDistance = distances.get(current) ?? 0;

      if (currentDistance >= maxDepth) {
        continue;
      }

      for (const next of adjacency.get(current) ?? []) {
        if (distances.has(next)) {
          continue;
        }

        distances.set(next, currentDistance + 1);
        queue.push(next);

        if (distances.size >= 80) {
          break;
        }
      }
    }

    const visibleNodeIds = new Set(distances.keys());
    const visibleEdges = edges.filter((edge) =>
      visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to)
    );

    const nodesByDepth = new Map<number, string[]>();

    for (const [id, distance] of distances.entries()) {
      const list = nodesByDepth.get(distance) ?? [];
      list.push(id);
      nodesByDepth.set(distance, list);
    }

    const visualNodes: VisualNode[] = [];
    const sourceNodes = new Map(nodes.map((node) => [node.id, node]));

    for (const [distance, ids] of [...nodesByDepth.entries()].sort()) {
      const sortedIds = ids.sort();
      const x = 120 + distance * 270;
      const spacing = Math.max(62, Math.min(105, 520 / sortedIds.length));
      const startY = 310 - ((sortedIds.length - 1) * spacing) / 2;

      sortedIds.forEach((id, index) => {
        const source = sourceNodes.get(id);

        if (source === undefined) {
          return;
        }

        visualNodes.push({
          id,
          title: source.title,
          kind: source.kind,
          count: 1,
          x,
          y: startY + index * spacing,
        });
      });
    }

    return {
      nodes: visualNodes,
      edges: visibleEdges.map((edge, index) => ({
        id: `${edge.from}:${edge.to}:${edge.relation}:${index}`,
        from: edge.from,
        to: edge.to,
        relation: edge.relation,
        count: 1,
      })),
    };
  }

  function addAdjacent(
    adjacency: Map<string, Set<string>>,
    from: string,
    to: string,
  ): void {
    const neighbors = adjacency.get(from) ?? new Set<string>();
    neighbors.add(to);
    adjacency.set(from, neighbors);
  }

  function topNamespace(id: string): string {
    return id.split(".")[0] ?? id;
  }
</script>

<main class="graph-shell">
  <nav class="top-nav graph-nav">
    <a href="/">Global Mathematics</a>
    <a href="/tree">Tree</a>
    <a href="/timeline">Timeline</a>
    <a href="/graph">Graph</a>
    <span>{siteData.graph.nodes.length} nodes · {siteData.graph.edges.length} edges</span>
  </nav>

  <section class="graph-header">
    <div>
      <p class="eyebrow">Knowledge Graph</p>
      <h1>Explore mathematical ideas by relationship.</h1>
      <p class="lede">
        Start from broad areas or inspect a local neighborhood. Relation filters
        keep the graph readable instead of rendering every edge at once.
      </p>
    </div>

    <div class="graph-controls">
      <label>
        <span>View</span>
        <select bind:value={mode}>
          <option value="overview">Area overview</option>
          <option value="local">Local neighborhood</option>
        </select>
      </label>

      <label>
        <span>Graph type</span>
        <select bind:value={profile}>
          <option value="learning">Learning</option>
          <option value="structure">Structure</option>
          <option value="history">History</option>
          <option value="all">All relations</option>
        </select>
      </label>

      <label>
        <span>Area</span>
        <select bind:value={namespace}>
          {#each namespaceOptions as option}
            <option value={option}>{namespaceLabel(option)}</option>
          {/each}
        </select>
      </label>

      {#if mode === "local"}
        <label>
          <span>Depth</span>
          <select bind:value={depth}>
            <option value={1}>1 step</option>
            <option value={2}>2 steps</option>
            <option value={3}>3 steps</option>
          </select>
        </label>
      {/if}
    </div>
  </section>

  <section class="graph-workspace">
    <aside class="graph-sidebar">
      <label class="graph-search">
        <span>Focus node</span>
        <input
          bind:value={query}
          type="search"
          autocomplete="off"
          placeholder="relation, category, quotient..."
        />
      </label>

      {#if matchingEntities.length > 0}
        <div class="graph-search-results">
          {#each matchingEntities as entity}
            <button type="button" onclick={() => chooseFocus(entity)}>
              <strong>{entity.title}</strong>
              <code>{entity.id}</code>
            </button>
          {/each}
        </div>
      {/if}

      <div class="graph-stats">
        <div>
          <strong>{graph.nodes.length}</strong>
          <span>visible nodes</span>
        </div>
        <div>
          <strong>{graph.edges.length}</strong>
          <span>visible edges</span>
        </div>
      </div>

      {#if selectedNode}
        <div class="graph-selection">
          <span class="graph-kind">{NODE_KIND_LABELS[selectedNode.kind]}</span>
          <h2>{selectedNode.title}</h2>
          <code>{selectedNode.id}</code>
          {#if "kind" in selectedNode && selectedNode.kind !== "namespace"}
            <a
              href={`/e/${selectedNode.id}`}
              target="_blank"
              rel="noreferrer"
            >Open entity page</a>
          {/if}
        </div>

        <dl class="graph-property-list">
          {#each selectedProperties as [name, value]}
            <div>
              <dt>{name}</dt>
              <dd>{value}</dd>
            </div>
          {/each}
        </dl>

        {#if selectedEdges.length > 0}
          <div class="graph-edge-list">
            <h2>Nearby edges</h2>
            {#each selectedEdges as edge}
              <div>
                <span>{edgeDirectionLabel(edge)} · {relationLabel(edge.relation)}</span>
                <code>{edge.from} → {edge.to}</code>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="graph-selection muted">
          <h2>No node selected</h2>
          <p>Select a node in the canvas or search for an entity.</p>
        </div>
      {/if}
    </aside>

    <section class="graph-canvas-panel">
      <SvelteFlow
        nodes={flowNodes}
        edges={flowEdges}
        {nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, minZoom: 0.45, maxZoom: 1.15 }}
        minZoom={0.35}
        maxZoom={1.8}
        nodeOrigin={[0.5, 0.5]}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        selectNodesOnDrag={false}
        defaultMarkerColor="#4b5552"
        onnodeclick={({ node }) => selectNode(node.id)}
        onpaneclick={() => (selectedId = undefined)}
      >
        <Background variant={BackgroundVariant.Lines} gap={36} color="#dce4e2" />
        <Controls />
        <MiniMap pannable zoomable />
      </SvelteFlow>
    </section>
  </section>
</main>
