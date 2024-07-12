<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  export let graphResults = { Nodes: [] };

  let svg;

  onMount(() => {
    drawMatrix();
  });

  $: if (svg && graphResults.Nodes.length > 0) {
    drawMatrix();
  }

  function drawMatrix() {
    const container = d3.select(svg);
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;

    const svgSelection = d3.select(svg);
    svgSelection.attr("viewBox", [0, 0, width, height]);
    svgSelection.selectAll("*").remove();

    const nodes = graphResults.Nodes.map((node) => node.Uri);
    const matrix = Array(nodes.length)
      .fill(0)
      .map(() => Array(nodes.length).fill(0));

    graphResults.Nodes.forEach((node, i) => {
      Object.entries(node.Links).forEach(([key, values]) => {
        values.forEach((value) => {
          const j = nodes.indexOf(value);
          matrix[i][j] = 1;
        });
      });
    });

    const xScale = d3.scaleBand().domain(nodes).range([0, width]);
    const yScale = d3.scaleBand().domain(nodes).range([0, height]);

    const g = svgSelection.append("g");

    g.selectAll("rect")
      .data(matrix.flatMap((row, i) => row.map((cell, j) => ({ i, j, cell }))))
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(nodes[d.j]))
      .attr("y", (d) => yScale(nodes[d.i]))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => (d.cell ? "steelblue" : "white"))
      .attr("stroke", "black");
  }
</script>

<svg bind:this={svg}></svg>
