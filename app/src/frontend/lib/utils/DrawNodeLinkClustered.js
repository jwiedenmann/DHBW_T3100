import * as d3 from "d3";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { hcs } from "./hcs";
import { mclAlgorithm } from "./mcl"; // Import the MCL algorithm

export function drawGraph(
    svg,
    graphResults,
    nodeLinkSettings,
    updateMetrics
) {
    if (!svg) return;

    const container = d3.select(svg.parentNode);
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;

    // Local variable to control the spread
    const spreadFactor = 1.5; // Increase for more horizontal spread, decrease for more vertical spread

    const svgSelection = d3.select(svg);
    svgSelection.attr("viewBox", [0, 0, width, height]);
    svgSelection.attr("width", width);
    svgSelection.attr("height", height);
    svgSelection.selectAll("*").remove();

    const g = svgSelection.append("g");

    const zoom = d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

    svgSelection.call(zoom);

    const nodes = graphResults.Nodes.map((node, i) => ({
        id: node.Uri,
        label: node.Label,
        properties: node.Properties,
        links: Object.values(node.Links).flat().length, // Count of links for each node
        x: (i % Math.sqrt(graphResults.Nodes.length)) * (width / Math.sqrt(graphResults.Nodes.length)) * spreadFactor, // Spread nodes horizontally
        y: (Math.floor(i / Math.sqrt(graphResults.Nodes.length))) * (height / Math.sqrt(graphResults.Nodes.length)) / spreadFactor // Spread nodes vertically
    }));

    // Create a Set to track unique edges
    const edgeSet = new Set();
    const links = graphResults.Nodes.flatMap((node) =>
        Object.entries(node.Links).flatMap(([key, values]) =>
            values
                .map((value) => {
                    const edgeKey = `${node.Uri}-${value}`;
                    if (!edgeSet.has(edgeKey)) {
                        edgeSet.add(edgeKey);
                        return {
                            source: node.Uri,
                            target: value,
                            predicate: key,
                        };
                    }
                    return null;
                })
                .filter((link) => link !== null)
        )
    );

    const graph = new Graph();
    nodes.forEach((node) => graph.addNode(node.id, node));
    links.forEach((link) => graph.addEdge(link.source, link.target));

    let communities = {};
    if (nodeLinkSettings.clusteringAlgorithm === "louvain") {
        communities = louvain(graph);
    } else if (nodeLinkSettings.clusteringAlgorithm === "hcs") {
        communities = hcs(graph);
    } else if (nodeLinkSettings.clusteringAlgorithm === "mcl") {
        communities = mclAlgorithm(graph); // Use the MCL algorithm
    } else {
        nodes.forEach((node, index) => {
            communities[node.id] = index; // Unique community for each node
        });
    }

    nodes.forEach((node) => {
        node.community = communities[node.id];
    });

    const uniqueCommunities = [...new Set(Object.values(communities))];
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueCommunities);

    const simulation = d3
        .forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(nodeLinkSettings.linkDistance))
        .force("charge", d3.forceManyBody().strength(nodeLinkSettings.chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(nodeLinkSettings.collisionRadius))
        .alpha(1) // Ensure the simulation starts with a high alpha value
        .alphaDecay(nodeLinkSettings.alphaDecay / 10000) // Decrease this value to slow down the simulation
        .on("tick", ticked);

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x).attr("cy", d => d.y);
    }

    const link = g
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = g
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", nodeLinkSettings.nodeSize)
        .attr("fill", d => colorScale(d.community))
        .call(drag(simulation))
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    node.append("title").text(d => d.label);

    updateMetrics(nodes.length, links.length);

    // FPS calculation using requestAnimationFrame
    let lastFrameTime = Date.now();
    let frameCount = 0;

    function calculateFPS() {
        frameCount++;
        const now = Date.now();
        const delta = (now - lastFrameTime) / 1000;

        if (delta >= 1) {
            const fps = frameCount / delta;
            updateMetrics(nodes.length, links.length, fps);
            frameCount = 0;
            lastFrameTime = now;
        }

        requestAnimationFrame(calculateFPS);
    }

    calculateFPS();

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

    function handleMouseOut() {
        d3.select("#tooltip").transition().duration(500).style("opacity", 0);
    }
}
