<script>
  export let selectedDiagram;
  export let radius;
  export let chargeStrength;
  export let linkDistance;
</script>

{#if selectedDiagram === "nodeLink"}
  <div class="form-control">
    <label class="label"><span class="label-text">Node Size: {radius}</span></label>
    <input
      type="range"
      min="5"
      max="50"
      bind:value={radius}
      class="range range-primary"
    />
  </div>
  <div class="form-control mt-4">
    <label class="label"><span class="label-text">Charge Strength: {chargeStrength}</span></label>
    <input
      type="range"
      min="-100"
      max="0"
      bind:value={chargeStrength}
      class="range range-primary"
    />
  </div>
  <div class="form-control mt-4">
    <label class="label"><span class="label-text">Link Distance: {linkDistance}</span></label>
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
