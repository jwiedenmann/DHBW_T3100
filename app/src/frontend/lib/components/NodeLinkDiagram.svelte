<script>
  import XIco from "../utils/icons/X.svelte";
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
    console.log(data);
    selectedData = data;
    sidebarVisible = true;
  }

  function closeSidebar() {
    sidebarVisible = false;
    selectedData = null;
  }

  function formatProperties(properties) {
    return Object.entries(properties).map(([key, value]) => {
      // Remove everything before the last slash in the key
      const formattedKey = key
        .substring(key.lastIndexOf("/") + 1)
        .replace(/@en$/, "");
      const formattedValue = value.replace(/@en$/, "");
      return { key: formattedKey, value: formattedValue };
    });
  }

  function getReadableLabel(uri, label) {
    if (label) {
      return label;
    }
    const baseResourceURI = "http://dbpedia.org/resource/";
    if (uri.startsWith(baseResourceURI)) {
      return uri.replace(baseResourceURI, "").replace(/_/g, " ");
    }
    return uri; // fallback to the full URI if it's not the expected format
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

<div class="flex flex-1 overflow-hidden">
  <svg bind:this={svg} id="graphSvg"></svg>

  <div
    class={`flex ${sidebarVisible ? "w-screen sm:w-1/2 md:w-1/2 lg:w-1/2" : "w-0"} transition-all duration-300`}
  >
    <div class="flex flex-col h-full w-full z-50 bg-base-200">
      <div class="flex flex-row items-center">
        <h2 class="text-lg font-bold flex-grow m-3">Details</h2>

        <button
          class={`w-6 m-2 mr-6 fill-current ${sidebarVisible ? "visible" : "hidden"}`}
          on:click={closeSidebar}
        >
          <XIco />
        </button>
      </div>

      {#if selectedData}
        <div class="m-3 overflow-auto">
          <p><strong>URI:</strong> {selectedData.id}</p>
          <div class="flex-grow border-t border-gray-300 my-3"></div>
          <p>
            <strong>Label:</strong>
            {getReadableLabel(selectedData.id, selectedData.label)}
          </p>
          <div class="flex-grow border-t border-gray-300 my-3"></div>
          <div>
            <strong>Properties:</strong>
            <ul class="list-disc list-inside">
              {#each formatProperties(selectedData.properties) as { key, value }}
                <li><strong>{key}:</strong> {value}</li>
              {/each}
            </ul>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  svg {
    width: 100%;
    height: 100%;
  }
</style>
