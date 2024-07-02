<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import { onMount, onDestroy } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";
  import * as d3 from "d3";

  let uri = null;
  let graphResults = [];

  onMount(() => {
    const params = getURLSearchParams();
    if (params.has("uri")) {
      uri = params.get("uri");
      loadResults();
    }

    // graphResults = getSampleData();
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

    return [];
  }

  function getSampleData() {
    return [
      { Subject: "A", Predicate: "relatedTo", Object: "B" },
      { Subject: "A", Predicate: "relatedTo", Object: "C" },
      { Subject: "B", Predicate: "relatedTo", Object: "D" },
      { Subject: "C", Predicate: "relatedTo", Object: "D" },
      { Subject: "D", Predicate: "relatedTo", Object: "E" }
    ];
  }

  function drawGraph() {
    const width = 800;
    const height = 400;
    const svg = d3.select("#graphSvg")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");

    const links = graphResults.map(d => ({
      source: d.Subject,
      target: d.Object,
    }));

    const nodes = Array.from(new Set(links.flatMap(l => [l.source, l.target])))
      .map(id => ({ id }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", 5)
      .attr("fill", "steelblue")
      .call(drag(simulation));

    node.append("title")
      .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
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

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  }
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar showSearchBar={false} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    <svg id="graphSvg"></svg>
  </main>

  <main class="flex-1 flex flex-col overflow-y-auto">
    {#each graphResults as graphResult}
      <div class="ml-6 mt-4 xl:ml-18">
        <h1 class="font-semibold text-xl">
          {graphResult.Subject}
          {graphResult.Predicate}
          {graphResult.Object}
        </h1>
      </div>
    {/each}
  </main>

  <Footer />
</div>

<style global lang="postcss">
</style>
