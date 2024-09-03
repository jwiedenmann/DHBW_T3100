<script>
  export let selectedDiagram;
  export let nodeLinkSettings;
  export let adjacencyMatrixSettings;
</script>

{#if selectedDiagram === "nodeLink"}
  <select
    class="select select-bordered w-full max-w-xs"
    bind:value={nodeLinkSettings.clusteringAlgorithm}
  >
    <option value="noClustering" selected>No Clustering</option>
    <option value="louvain">Louvain Method</option>
    <!-- <option value="hcs">HCS Clustering</option>
    <option value="mcl">MCL Clustering</option> -->
  </select>
  {#if nodeLinkSettings.clusteringAlgorithm !== "noClustering"}
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Combine Node Clusters</span>
        <input
          type="checkbox"
          bind:checked={nodeLinkSettings.combineNodeClusters}
          class="checkbox checkbox-primary"
        />
      </label>
    </div>
  {/if}
  <div class="form-control">
    <label class="label"
      ><span class="label-text">Node Size: {nodeLinkSettings.nodeSize}</span
      ></label
    >
    <input
      type="range"
      min="1"
      max="30"
      bind:value={nodeLinkSettings.nodeSize}
      class="range range-primary"
    />
  </div>
  <div class="form-control">
    <label class="label"
      ><span class="label-text"
        >Collision Radius: {nodeLinkSettings.collisionRadius}</span
      ></label
    >
    <input
      type="range"
      min="5"
      max="50"
      bind:value={nodeLinkSettings.collisionRadius}
      class="range range-primary"
    />
  </div>
  <div class="form-control">
    <label class="label"
      ><span class="label-text"
        >Charge Strength: {nodeLinkSettings.chargeStrength}</span
      ></label
    >
    <input
      type="range"
      min="-100"
      max="0"
      bind:value={nodeLinkSettings.chargeStrength}
      class="range range-primary"
    />
  </div>
  <div class="form-control">
    <label class="label"
      ><span class="label-text"
        >Link Distance: {nodeLinkSettings.linkDistance}</span
      ></label
    >
    <input
      type="range"
      min="10"
      max="200"
      bind:value={nodeLinkSettings.linkDistance}
      class="range range-primary"
    />
  </div>
  <div class="form-control">
    <label class="label"
      ><span class="label-text">Alpha Decay: {nodeLinkSettings.alphaDecay}</span
      ></label
    >
    <input
      type="range"
      min="1"
      max="500"
      bind:value={nodeLinkSettings.alphaDecay}
      class="range range-primary"
    />
  </div>
  {#if nodeLinkSettings.clusteringAlgorithm === "noClustering"}
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Color Nodes by Links</span>
        <input
          type="checkbox"
          bind:checked={nodeLinkSettings.colorAndSizeByLinks}
          class="checkbox checkbox-primary"
        />
      </label>
    </div>
  {/if}
{:else if selectedDiagram === "adjacencyMatrix"}
  <div class="form-control">
    <label class="label cursor-pointer">
      <span class="label-text">Show Border</span>
      <input
        type="checkbox"
        bind:checked={adjacencyMatrixSettings.showGrid}
        class="checkbox checkbox-primary"
      />
    </label>
  </div>
{/if}
