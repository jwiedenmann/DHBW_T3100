<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import HamburgerIco from "../utils/icons/Hamburger.svelte";
  import XIco from "../utils/icons/X.svelte";
  import ReloadIco from "../utils/icons/Reload.svelte";
  import NodeLinkDiagram from "../components/NodeLinkDiagram.svelte";
  import AdjacencyMatrix from "../components/AdjacencyMatrix.svelte";
  import Menu from "../components/GraphSettings.svelte";
  import { onMount } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";
  import { writable } from "svelte/store";

  let uri = null;
  let graphResults = { Nodes: [] };

  // Graph Settings
  let graphSettings = {
    dataSettings: {
      graphLoadingDepth: 3,
      limit: 10,
    },
    nodeLinkSettings: {
      nodeSize: 5,
      chargeStrength: -30,
      linkDistance: 50,
      collisionRadius: 20,
      alphaDecay: 100,
      clusteringAlgorithm: "noClustering",
      combineNodeClusters: false,
      colorAndSizeByLinks: false,
    },
    adjacencyMatrixSettings: {
      showGrid: true,
      staticData: false,
    },
    generalSettings: {
      showPerformanceMetrics: false,
    },
  };

  let sidebarOpen = true;
  let selectedDiagram = "nodeLink";
  let diagramLabel = "Node Link Diagram";
  const dropdownOpen = writable(false);
  let loading = writable(true);

  onMount(() => {
    const params = getURLSearchParams();
    if (params.has("uri")) {
      uri = params.get("uri");
      loadInitialGraph();
    }
  });

  async function loadInitialGraph() {
    try {
      loading.set(true);
      graphResults = await fetchGraph(
        uri,
        graphSettings.dataSettings.graphLoadingDepth,
        graphSettings.dataSettings.limit
      );
      console.log(graphResults);
      graphResults = { ...graphResults }; // Trigger reactivity
    } catch (error) {
      console.log(error);
    } finally {
      loading.set(false);
    }
  }

  async function fetchGraph(uri, graphLoadingDepth, limit) {
    const url = new URL(
      import.meta.env.VITE_ROUTE_Sparql_Graph,
      // couldnt get the env variables to work...
      import.meta.env.MODE === "production"
        ? "http://localhost:8080"
        : import.meta.env.VITE_BASE_URL
    );
    url.searchParams.append("uri", uri);
    url.searchParams.append("loadingDepth", graphLoadingDepth);
    url.searchParams.append("limit", limit);
    const response = await fetch(url);
    if (response.ok) {
      return response.json();
    }
    return { Nodes: [] };
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

<div class="h-screen flex flex-col">
  <Navbar showSearchBar={false} />

  <div class="flex flex-1 overflow-hidden">
    <button
      class={`w-6 m-6 z-10 absolute ${sidebarOpen ? "hidden" : "visible"}`}
      on:click={toggleSidebar}
    >
      <HamburgerIco />
    </button>
    <div
      class={`flex ${sidebarOpen ? "w-screen sm:w-48 md:w-56 lg:w-64" : "w-0"} transition-all duration-300`}
    >
      <div class="flex flex-col h-full w-full z-50 bg-base-200">
        <div class="flex flex-row">
          {#if sidebarOpen}
            <details class="dropdown flex-1 z-50" bind:open={$dropdownOpen}>
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
            class={`w-6 m-2 mr-6 fill-current`}
            on:click={loadInitialGraph}
          >
            <ReloadIco />
          </button>

          <button
            class={`w-6 m-2 mr-6 fill-current ${sidebarOpen ? "visible" : "hidden"}`}
            on:click={toggleSidebar}
          >
            <XIco />
          </button>
        </div>
        {#if sidebarOpen}
          <div class="p-4 overflow-y-auto">
            <!-- Divider -->
            <div class="relative flex pb-5 items-center">
              <div class="flex-grow border-t border-gray-300"></div>
              <span class="flex-shrink mx-4 text-gray-400">Data Settings</span>
              <div class="flex-grow border-t border-gray-300"></div>
            </div>

            <!-- Loading Depth Settings -->
            <div class="flex items-center">
              <label
                for="integer-input-depth"
                class="label whitespace-nowrap mr-1"
                ><span class="label-text">Loading Iterations:</span></label
              >
              <input
                id="integer-input-depth"
                bind:value={graphSettings.dataSettings.graphLoadingDepth}
                class="input input-bordered text-right flex-shrink w-full max-w-xs min-w-0"
              />
            </div>

            <!-- Limit Settings -->
            <div class="flex items-center mt-2">
              <label
                for="integer-input-limit"
                class="label whitespace-nowrap mr-1"
                ><span class="label-text">Node Limit:</span></label
              >
              <input
                id="integer-input-limit"
                bind:value={graphSettings.dataSettings.limit}
                class="input input-bordered text-right flex-shrink w-full max-w-xs min-w-0"
              />
            </div>

            <!-- Divider -->
            <div class="relative flex py-5 items-center">
              <div class="flex-grow border-t border-gray-300"></div>
              <span class="flex-shrink mx-4 text-gray-400">Graph Settings</span>
              <div class="flex-grow border-t border-gray-300"></div>
            </div>

            <Menu
              {selectedDiagram}
              bind:nodeLinkSettings={graphSettings.nodeLinkSettings}
              bind:adjacencyMatrixSettings={graphSettings.adjacencyMatrixSettings}
            />

            <!-- Divider -->
            <div class="relative flex py-5 items-center">
              <div class="flex-grow border-t border-gray-300"></div>
              <span class="flex-shrink mx-4 text-gray-400"
                >General Settings</span
              >
              <div class="flex-grow border-t border-gray-300"></div>
            </div>

            <!-- Performance Visibility Settings -->
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text">Show Performance Metrics</span>
                <input
                  type="checkbox"
                  bind:checked={graphSettings.generalSettings
                    .showPerformanceMetrics}
                  class="checkbox checkbox-primary"
                />
              </label>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <main id="graphContainer" class="flex-1 flex flex-col overflow-y-auto">
      {#if $loading}
        <div class="flex justify-center items-center h-full">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {:else}
        {#if selectedDiagram === "nodeLink"}
          <NodeLinkDiagram
            {graphResults}
            nodeLinkSettings={graphSettings.nodeLinkSettings}
            generalSettings={graphSettings.generalSettings}
          />
        {/if}
        {#if selectedDiagram === "adjacencyMatrix"}
          <AdjacencyMatrix
            {graphResults}
            adjacencyMatrixSettings={graphSettings.adjacencyMatrixSettings}
            generalSettings={graphSettings.generalSettings}
          />
        {/if}
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
