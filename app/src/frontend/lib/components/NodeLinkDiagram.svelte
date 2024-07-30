<script>
  import { onMount } from "svelte";
  import { drawGraph as drawNodeLinkGraph } from "../utils/DrawNodeLink";
  import { drawGraph as drawNodeLinkGraphClustered } from "../utils/DrawNodeLinkClustered";

  export let graphResults = { Nodes: [] };
  export let chargeStrength = -30;
  export let linkDistance = 50;
  export let collisionRadius = 20;
  export let nodeSize = 5;
  export let alphaDecay = 100;
  export let clusteringAlgorithm = "noClustering";
  export let colorAndSizeByLinks = false;
  export let showPerformanceMetrics;

  // Performance metrics
  let fps = 0;
  let nodeCount = 0;
  let edgeCount = 0;

  let svg;

  onMount(() => {
    drawGraph(
      svg,
      graphResults,
      chargeStrength,
      linkDistance,
      collisionRadius,
      nodeSize,
      alphaDecay,
      colorAndSizeByLinks,
      clusteringAlgorithm,
      updateMetrics
    );
  });

  $: drawGraph(
    svg,
    graphResults,
    chargeStrength,
    linkDistance,
    collisionRadius,
    nodeSize,
    alphaDecay,
    colorAndSizeByLinks,
    clusteringAlgorithm,
    updateMetrics
  );

  function drawGraph(
    svg,
    graphResults,
    chargeStrength,
    linkDistance,
    collisionRadius,
    nodeSize,
    alphaDecay,
    colorAndSizeByLinks,
    clusteringAlgorithm,
    updateMetrics
  ) {
    if (clusteringAlgorithm === "noClustering") {
      drawNodeLinkGraph(
        svg,
        graphResults,
        chargeStrength,
        linkDistance,
        collisionRadius,
        nodeSize,
        alphaDecay,
        colorAndSizeByLinks,
        updateMetrics
      );
    } else {
      drawNodeLinkGraphClustered(
        svg,
        graphResults,
        chargeStrength,
        linkDistance,
        collisionRadius,
        nodeSize,
        alphaDecay,
        colorAndSizeByLinks,
        clusteringAlgorithm,
        updateMetrics
      );
    }
  }

  function updateMetrics(nodes, edges, frameRate) {
    nodeCount = nodes;
    edgeCount = edges;
    if (frameRate) fps = frameRate;
  }
</script>

{#if showPerformanceMetrics === true}
  <div class="relative">
    <div class="toast toast-top toast-end absolute z-50 top-4 right-4">
      <div class="alert alert-info">
        <div class="text-primary-content">
          <div>FPS: {fps.toFixed(2)}</div>
          <div>Nodes: {nodeCount}</div>
          <div>Edges: {edgeCount}</div>
        </div>
      </div>
    </div>
  </div>
{/if}

<svg bind:this={svg} id="graphSvg"></svg>
<div id="tooltip" class="tooltip"></div>

<style>
  svg {
    width: 100%;
    height: 100%;
  }

  .tooltip {
    opacity: 0;
    position: absolute;
    text-align: left;
    width: auto;
    height: auto;
    padding: 5px;
    font: 12px sans-serif;
    background: lightsteelblue;
    border: 0px;
    border-radius: 8px;
    pointer-events: none;
  }

  .tooltip .nowrap {
    white-space: nowrap;
  }

  .tooltip strong {
    font-weight: bold;
  }
</style>
