<script>
  import { onMount } from "svelte";
  export let graphResults = { Nodes: [] };
  export let showGrid;

  // Extract links from the graphResults.Nodes
  const links = graphResults.Nodes.flatMap((node) =>
    Object.entries(node.Links).flatMap(([key, values]) =>
      values.map((value) => ({
        source: node.Uri,
        target: value,
        predicate: key,
      }))
    )
  );

  // Create an adjacency matrix
  const nodeUris = graphResults.Nodes.map((node) => node.Uri);
  const nodeCount = nodeUris.length;
  const adjacencyMatrix = Array.from({ length: nodeCount }, () =>
    Array(nodeCount).fill(0)
  );

  links.forEach((link) => {
    const sourceIndex = nodeUris.indexOf(link.source);
    const targetIndex = nodeUris.indexOf(link.target);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      adjacencyMatrix[sourceIndex][targetIndex] = 1; // Link from source to target
      adjacencyMatrix[targetIndex][sourceIndex] = 1; // Link from target to source
    }
  });

  let svg;
  let zoomLevel = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isPanning = false;
  let startX, startY;

  function handleWheel(event) {
    event.preventDefault();
    const scaleFactor = 0.001; // Smaller scale factor for more gradual zooming
    zoomLevel += event.deltaY * -scaleFactor;
    zoomLevel = Math.min(Math.max(0.125, zoomLevel), 4);
    updateTransform();
  }

  function handleMouseDown(event) {
    isPanning = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
  }

  function handleMouseMove(event) {
    if (!isPanning) return;
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;
    updateTransform();
  }

  function handleMouseUp() {
    isPanning = false;
  }

  function updateTransform() {
    svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
  }

  onMount(() => {
    svg.addEventListener("wheel", handleWheel);
    svg.addEventListener("mousedown", handleMouseDown);
    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseup", handleMouseUp);
    svg.addEventListener("mouseleave", handleMouseUp);
  });
</script>

<div class="w-full h-full overflow-hidden relative">
  <svg
    bind:this={svg}
    class="absolute top-0 left-0"
    viewBox="0 0 {nodeCount} {nodeCount}"
    xmlns="http://www.w3.org/2000/svg"
  >
    {#each adjacencyMatrix as row, rowIndex}
      {#each row as cell, colIndex}
        <!-- Cell border -->
        {#if showGrid === true}
          <rect
            x={colIndex}
            y={rowIndex}
            width="1"
            height="1"
            fill="none"
            stroke={"#999"}
            stroke-width="0.01"
          />
        {/if}
        <!-- Cell fill -->
        {#if cell === 1}
          <rect
            x={colIndex}
            y={rowIndex}
            width="1"
            height="1"
            fill="steelblue"
          />
        {/if}
      {/each}
    {/each}
  </svg>
</div>

<style>
  svg {
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>
