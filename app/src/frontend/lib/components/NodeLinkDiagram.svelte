<script>
  import { onMount } from "svelte";
  import { drawGraph as drawNodeLinkGraph } from "../utils/DrawNodeLink";
  import { drawGraph as drawNodeLinkGraphClustered } from "../utils/DrawNodeLinkClustered";

  export let graphResults = { Nodes: [] };
  export let nodeLinkSettings;
  export let generalSettings;

  // Performance metrics
  let fps = 0;
  let nodeCount = 0;
  let edgeCount = 0;

  let svg;

  // Sidebar state management
  let sidebarVisible = false;
  let selectedData = null;

  onMount(() => {
    drawGraph(
      svg,
      graphResults,
      nodeLinkSettings,
      updateMetrics,
      handleNodeClick
    );
  });

  $: drawGraph(
    svg,
    graphResults,
    nodeLinkSettings,
    updateMetrics,
    handleNodeClick
  );

  function drawGraph(
    svg,
    graphResults,
    nodeLinkSettings,
    updateMetrics,
    handleNodeClick
  ) {
    if (nodeLinkSettings.clusteringAlgorithm === "noClustering") {
      drawNodeLinkGraph(
        svg,
        graphResults,
        nodeLinkSettings,
        updateMetrics,
        handleNodeClick
      );
    } else {
      drawNodeLinkGraphClustered(
        svg,
        graphResults,
        nodeLinkSettings,
        updateMetrics,
        handleNodeClick
      );
    }
  }

  function updateMetrics(nodes, edges, frameRate) {
    nodeCount = nodes;
    edgeCount = edges;
    if (frameRate) fps = frameRate;
  }

  function handleNodeClick(data) {
    console.log(data)
    selectedData = data;
    sidebarVisible = true;
  }

  function closeSidebar() {
    sidebarVisible = false;
    selectedData = null;
  }
</script>

{#if generalSettings.showPerformanceMetrics === true}
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

<div id="tooltip" class="tooltip"></div>

<div class="flex flex-1 overflow-hidden">
  <svg bind:this={svg} id="graphSvg"></svg>

  <div
    class={`flex ${sidebarVisible ? "w-screen sm:w-48 md:w-56 lg:w-64" : "w-0"} transition-all duration-300`}
  >
    <div class="flex flex-col h-full w-full z-50 bg-base-200">
      <button class="btn btn-sm btn-outline float-right" on:click={closeSidebar}
        >Close</button
      >

      <h2 class="text-lg font-bold mb-4">Details</h2>
      {#if selectedData}
        <p><strong>URI:</strong> {selectedData.id}</p>
        <p><strong>Label:</strong> {selectedData.label}</p>
        <p>
          <strong>Properties:</strong>
          {JSON.stringify(selectedData.properties, null, 2)}
        </p>
      {/if}
    </div>
  </div>
</div>

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
