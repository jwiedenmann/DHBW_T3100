<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import { onMount, onDestroy } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";
  import * as d3 from "d3";

  let uri = null;
  let graphResults = { Nodes: [] };

  onMount(() => {
    const params = getURLSearchParams();
    if (params.has("uri")) {
      uri = params.get("uri");
      loadResults();
    }
  });

  function loadResults() {
    fetchResults().then(
      function (value) {
        graphResults = value;
        drawGraph();
      },
      function (error) {
        console.log(error);
      }
    );
  }

  async function fetchResults() {
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

  function drawGraph() {
    const width = 800;
    const height = 400;
    const svg = d3.select("#graphSvg");

    // Clear the previous graph
    svg.selectAll("*").remove();

    svg
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    const nodes = graphResults.Nodes.map((node) => ({
      id: node.Uri,
      label: node.Label,
      properties: node.Properties,
    }));

    const links = graphResults.Nodes.flatMap((node) =>
      Object.entries(node.Links).map(([key, value]) => ({
        source: node.Uri,
        target: value,
        predicate: key,
      }))
    );

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", "steelblue")
      .call(drag(simulation))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    node.append("title").text((d) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    function handleMouseOver(event, d) {
      const tooltip = d3.select("#tooltip");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `<div><strong>URI:</strong> <span class="nowrap">${d.id}</span></div>
                    <div><strong>Label:</strong> ${d.label}</div>
                    <div><strong>Properties:</strong> ${JSON.stringify(d.properties)}</div>`
        )
        .style("left", event.pageX + 5 + "px")
        .style("top", event.pageY - 28 + "px");
    }

    function handleMouseOut(event, d) {
      const tooltip = d3.select("#tooltip");
      tooltip.transition().duration(500).style("opacity", 0);
    }
  }
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar showSearchBar={false} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    <svg id="graphSvg"></svg>
    <div id="tooltip" class="tooltip"></div>
  </main>

  <main class="flex-1 flex flex-col overflow-y-auto">
    {#each graphResults.Nodes as node}
      <div class="ml-6 mt-4 xl:ml-18">
        <h1 class="font-semibold text-xl">
          {node.Uri}
          {Object.keys(node.Links).join(", ")}
          {Object.values(node.Links).join(", ")}
        </h1>
      </div>
    {/each}
  </main>

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
