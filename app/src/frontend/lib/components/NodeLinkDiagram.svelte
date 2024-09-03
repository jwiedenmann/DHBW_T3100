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
  let isCluster = false; // Track if the selected data is a cluster
  let expandedNodes = {}; // Track expanded nodes within a cluster

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
    isCluster = !!data.originalNodes; // Check if this is a cluster
    expandedNodes = {}; // Reset expanded nodes state
    sidebarVisible = true;
  }

  function closeSidebar() {
    sidebarVisible = false;
    selectedData = null;
    isCluster = false;
    expandedNodes = {};
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

  function toggleNodeExpansion(nodeId) {
    expandedNodes = {
      ...expandedNodes,
      [nodeId]: !expandedNodes[nodeId], // Toggle the expansion state
    };
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
          {#if isCluster}
            <!-- Display cluster information -->
            <p><strong>Cluster Label:</strong> {selectedData.label}</p>
            <p>
              <strong>Number of Nodes in Cluster:</strong>
              {selectedData.originalNodes.length}
            </p>
            <div class="flex-grow border-t border-gray-300 my-3"></div>
            <div>
              <strong>Cluster Nodes:</strong>
              {#each selectedData.originalNodes as node}
                <div>
                  <button
                    on:click={() => toggleNodeExpansion(node.id)}
                    class="text-left w-full"
                  >
                    {expandedNodes[node.id] ? "▼" : "▶"}
                    {getReadableLabel(node.id, node.label)}
                  </button>
                  {#if expandedNodes[node.id]}
                    <!-- Show expanded node details -->
                    <div class="ml-4 mt-2">
                      <p><strong>URI:</strong> {node.id}</p>
                      <p>
                        <strong>Label:</strong>
                        {getReadableLabel(node.id, node.label)}
                      </p>
                      <p><strong>Properties:</strong></p>
                      <div class="ml-4">
                        {#each formatProperties(node.properties) as { key, value }}
                          <p><strong>{key}:</strong> {value}</p>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <!-- Display individual node information -->
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
          {/if}
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
  button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    text-align: left;
    cursor: pointer;
  }
  button:focus {
    outline: none;
  }
</style>
