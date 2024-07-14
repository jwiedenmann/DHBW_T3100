<script>
  export let selectedDiagram;
  export let nodeSize;
  export let collisionRadius;
  export let chargeStrength;
  export let linkDistance;
</script>

{#if selectedDiagram === "nodeLink"}
  <div class="form-control">
    <label class="label"
      ><span class="label-text">Node Size: {nodeSize}</span></label
    >
    <input
      type="range"
      min="1"
      max="30"
      bind:value={nodeSize}
      class="range range-primary"
    />
  </div>
  <div class="form-control">
    <label class="label"
      ><span class="label-text">Collision Radius: {collisionRadius}</span
      ></label
    >
    <input
      type="range"
      min="5"
      max="50"
      bind:value={collisionRadius}
      class="range range-primary"
    />
  </div>
  <div class="form-control mt-4">
    <label class="label"
      ><span class="label-text">Charge Strength: {chargeStrength}</span></label
    >
    <input
      type="range"
      min="-100"
      max="0"
      bind:value={chargeStrength}
      class="range range-primary"
    />
  </div>
  <div class="form-control mt-4">
    <label class="label"
      ><span class="label-text">Link Distance: {linkDistance}</span></label
    >
    <input
      type="range"
      min="10"
      max="200"
      bind:value={linkDistance}
      class="range range-primary"
    />
  </div>
{:else if selectedDiagram === "adjacencyMatrix"}
  <div></div>
{/if}
