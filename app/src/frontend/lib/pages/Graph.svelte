<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import HamburgerIco from "../utils/icons/Hamburger.svelte";
  import XIco from "../utils/icons/X.svelte";
  import NodeLinkDiagram from "../components/NodeLinkDiagram.svelte";
  import AdjacencyMatrix from "../components/AdjacencyMatrix.svelte";
  import { onMount } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";
  import { writable } from "svelte/store";

  let uri = null;
  let graphResults = { Nodes: [] };
  let chargeStrength = -30;
  let linkDistance = 50;
  let radius = 20;
  let sidebarOpen = true;
  let selectedDiagram = "nodeLink";
  let diagramLabel = "Node Link Diagram";
  const dropdownOpen = writable(false);

  onMount(() => {
    const params = getURLSearchParams();
    if (params.has("uri")) {
      uri = params.get("uri");
      loadInitialGraph();
    }
  });

  async function loadInitialGraph() {
    try {
      graphResults = await fetchGraph(uri);
      await loadNodeGraphs(graphResults.Nodes);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchGraph(uri) {
    const url = new URL(
      import.meta.env.VITE_ROUTE_Sparql_Graph,
      import.meta.env.VITE_BASE_URL
    );
    url.searchParams.append("uri", uri);
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    }
    return { Nodes: [] };
  }

  async function loadNodeGraphs(nodes) {
    const nodesCopy = Array.from(nodes);
    let count = 0;
    for (const node of nodesCopy) {
      if (count === 10) return;

      try {
        const nodeGraph = await fetchGraph(node.Uri);
        mergeGraphs(graphResults, nodeGraph);
        console.log("merge " + count.toString())
      } catch (error) {
        console.log(`Failed to load graph for node ${node.Uri}: `, error);
      }

      count++;
    }
  }

  function mergeGraphs(mainGraph, nodeGraph) {
    const nodeUriMap = new Map(mainGraph.Nodes.map((node) => [node.Uri, node]));

    nodeGraph.Nodes.forEach((node) => {
      const existingNode = nodeUriMap.get(node.Uri);
      if (
        !existingNode ||
        Object.values(existingNode.Links).every(
          (linkList) => linkList.length === 0
        )
      ) {
        nodeUriMap.set(node.Uri, node);
      }
    });

    mainGraph.Nodes = Array.from(nodeUriMap.values());
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function selectDiagram(type, label) {
    selectedDiagram = type;
    diagramLabel = label;
    dropdownOpen.set(false);
  }
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar showSearchBar={false} />

  <div class="h-screen flex flex-row">
    <button
      class={`w-6 m-6 z-10 absolute ${sidebarOpen ? "hidden" : "visible"}`}
      on:click={toggleSidebar}
    >
      <HamburgerIco />
    </button>
    <div
      class={`flex ${sidebarOpen ? "w-screen sm:w-48 md:w-56 lg:w-64" : "w-0"} transition-all duration-300`}
    >
      <div class="flex flex-col h-full w-full z-20 bg-base-200">
        <div class="flex flex-row">
          {#if sidebarOpen}
            <details class="dropdown flex-1" bind:open={$dropdownOpen}>
              <summary class="btn btn-primary m-3">{diagramLabel}</summary>
              <ul
                class="menu dropdown-content bg-base-100 rounded-box w-52 p-2 shadow"
              >
                <li>
                  <a
                    on:click={() =>
                      selectDiagram("nodeLink", "Node Link Diagram")}
                    >Node Link Diagram</a
                  >
                </li>
                <li>
                  <a
                    on:click={() =>
                      selectDiagram("adjacencyMatrix", "Adjacency Matrix")}
                    >Adjacency Matrix</a
                  >
                </li>
              </ul>
            </details>
          {/if}

          <button
            class={`w-6 m-2 mr-6 fill-current ${sidebarOpen ? "visible" : "hidden"}`}
            on:click={toggleSidebar}
          >
            <XIco />
          </button>
        </div>
        {#if sidebarOpen}
          <div class="p-4">
            {#if selectedDiagram === "nodeLink"}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Node Size</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  bind:value={radius}
                  class="range range-primary"
                />
              </div>
              <div class="form-control mt-4">
                <label class="label">
                  <span class="label-text">Charge Strength</span>
                </label>
                <input
                  type="range"
                  min="-100"
                  max="0"
                  bind:value={chargeStrength}
                  class="range range-primary"
                />
              </div>
              <div class="form-control mt-4">
                <label class="label">
                  <span class="label-text">Link Distance</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  bind:value={linkDistance}
                  class="range range-primary"
                />
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <main id="graphContainer" class="flex-1 flex flex-col overflow-y-auto">
      {#if selectedDiagram === "nodeLink"}
        <NodeLinkDiagram
          {graphResults}
          {chargeStrength}
          {linkDistance}
          {radius}
        />
      {/if}
      {#if selectedDiagram === "adjacencyMatrix"}
        <AdjacencyMatrix {graphResults} />
      {/if}
    </main>
  </div>

  <Footer />
</div>

<style global lang="postcss">
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
