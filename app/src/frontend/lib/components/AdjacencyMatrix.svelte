<script>
  import { onMount } from "svelte";
  import * as d3 from "d3";

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
      d3.select(svg).attr(
        "transform",
        `translate(${offsetX}, ${offsetY}) scale(${zoomLevel})`
      );
      const transformEnd = performance.now();
      svgRenderTime = transformEnd - transformStart;
    });
  }

  onMount(() => {
    d3.select(svg).call(
      d3.zoom().on("zoom", (event) => {
        d3.select(svg).attr("transform", event.transform);
      })
    );

    svg.addEventListener("mousedown", handleMouseDown);
    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseup", handleMouseUp);
    svg.addEventListener("mouseleave", handleMouseUp);

    // Start the frame rate monitoring
    lastFrameTime = performance.now();
    requestAnimationFrame(updateFrameRate);

    drawMatrix();
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

  function drawMatrix() {
    const nodeUris = graphResults.Nodes.map((node) => node.Uri);
    const nodes = nodeUris.map((uri, i) => ({ id: uri, index: i }));
    const edges = links.map((link) => ({
      source: nodeUris.indexOf(link.source),
      target: nodeUris.indexOf(link.target),
      weight: 1,
    }));

    const size = [500, 500];
    const nodeWidth = size[0] / nodes.length;
    const nodeHeight = size[1] / nodes.length;
    const xScale = d3
      .scaleLinear()
      .domain([0, nodes.length])
      .range([0, size[0]]);
    const yScale = d3
      .scaleLinear()
      .domain([0, nodes.length])
      .range([0, size[1]]);

    const edgeHash = {};
    edges.forEach((edge) => {
      const id = `${edge.source}-${edge.target}`;
      const reverseId = `${edge.target}-${edge.source}`;
      edgeHash[id] = edge;
      edgeHash[reverseId] = edge;
    });

    const matrix = [];
    nodes.forEach((sourceNode, a) => {
      nodes.forEach((targetNode, b) => {
        const grid = {
          id: `${sourceNode.id}-${targetNode.id}`,
          source: sourceNode,
          target: targetNode,
          x: xScale(b),
          y: yScale(a),
          weight: edgeHash[`${sourceNode.index}-${targetNode.index}`] ? 1 : 0,
          height: nodeHeight,
          width: nodeWidth,
        };
        matrix.push(grid);
      });
    });

    const row = d3
      .select(svg)
      .selectAll(".row")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "row");

    row
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .style("fill", (d) => (d.weight > 0 ? "steelblue" : "#fff"))
      .style("stroke", (d) => (showGrid ? "#999" : "none"));
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
    viewBox="0 0 500 500"
    xmlns="http://www.w3.org/2000/svg"
  ></svg>
</div>

<style>
  svg {
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .cell {
    shape-rendering: crispEdges;
  }
</style>
