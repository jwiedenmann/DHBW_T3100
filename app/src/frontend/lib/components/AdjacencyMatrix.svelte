<script>
  import { onMount } from "svelte";
  export let graphResults = { Nodes: [] };
  export let showGrid;
  export let showPerformanceMetrics;

  // Performance metrics
  let svgRenderTime = 0;
  let lastFrameTime = 0;
  let frameCount = 0;
  let fps = 0;

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
    const transformStart = performance.now();
    requestAnimationFrame(() => {
      svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
      const transformEnd = performance.now();
      svgRenderTime = transformEnd - transformStart;
    });
  }

  onMount(() => {
    svg.addEventListener("wheel", handleWheel);
    svg.addEventListener("mousedown", handleMouseDown);
    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseup", handleMouseUp);
    svg.addEventListener("mouseleave", handleMouseUp);

    // Start the frame rate monitoring
    lastFrameTime = performance.now();
    requestAnimationFrame(updateFrameRate);
  });

  function updateFrameRate() {
    const now = performance.now();
    frameCount++;
    const deltaTime = now - lastFrameTime;
    lastFrameTime = now;

    // Calculate FPS
    fps = 1000 / deltaTime;

    // Continue monitoring
    requestAnimationFrame(updateFrameRate);
  }
</script>

<div class="relative w-full h-full overflow-hidden">
  {#if showPerformanceMetrics === true}
    <div class="toast toast-top toast-end absolute z-50 top-4 right-4">
      <div class="alert alert-info">
        <div class="text-primary-content">
          <div>FPS: {fps.toFixed(2)}</div>
          <div>Last SVG render time: {svgRenderTime.toFixed(2)} ms</div>
        </div>
      </div>
    </div>
  {/if}

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
