import * as d3 from "d3";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { hcs } from "./hcs";
import { mclAlgorithm } from "./mcl"; // Import the MCL algorithm

export function drawGraph(
    svg,
    graphResults,
    chargeStrength,
    linkDistance,
    collisionRadius,
    nodeSize,
    alphaDecay,
    colorAndSizeByLinks,
    clusteringAlgorithm,
    updateMetrics
) {
    if (!svg) return;

    const container = d3.select(svg.parentNode);
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;

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

    const nodes = graphResults.Nodes.map((node) => ({
        id: node.Uri,
        label: node.Label,
        properties: node.Properties,
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
    if (clusteringAlgorithm === "louvain") {
        communities = louvain(graph);
    } else if (clusteringAlgorithm === "hcs") {
        communities = hcs(graph);
    } else if (clusteringAlgorithm === "mcl") {
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

    // Calculate initial centroids for each community
    const centroids = {};
    uniqueCommunities.forEach(community => {
        centroids[community] = { x: width / 2, y: height / 2 };
    });

    const simulation = d3
        .forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance))
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(collisionRadius))
        .on("tick", ticked);

    function ticked() {
        // Update community centroids
        uniqueCommunities.forEach(community => {
            const communityNodes = nodes.filter(d => d.community === community);
            const centroid = calculateCentroid(communityNodes);
            centroids[community] = centroid;
        });

        // Apply forces to nodes based on their community centroids
        nodes.forEach(node => {
            const centroid = centroids[node.community];
            node.vx += (centroid.x - node.x) * 0.1; // Adjust this value to control the "tightness"
            node.vy += (centroid.y - node.y) * 0.1;
        });

        // Update the positions of nodes and links
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x).attr("cy", d => d.y);

        // Update community hulls
        hulls.attr("d", (community) => {
            const communityNodes = nodes.filter((d) => d.community === community);
            if (communityNodes.length > 2) { // A convex hull needs at least 3 points
                const hull = d3.polygonHull(communityNodes.map((d) => [d.x, d.y]));
                return hull ? "M" + hull.join("L") + "Z" : null;
            }
            return null;
        });
    }

    function calculateCentroid(nodes) {
        const x = d3.mean(nodes, d => d.x);
        const y = d3.mean(nodes, d => d.y);
        return { x, y };
    }

    // Draw community hulls
    const hulls = g
        .append("g")
        .attr("class", "hulls")
        .selectAll("path")
        .data(uniqueCommunities)
        .enter()
        .append("path")
        .attr("fill", d => colorScale(d))
        .attr("stroke", d => colorScale(d))
        .attr("stroke-width", 2)
        .attr("opacity", 0.2);

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
        .attr("r", nodeSize)
        .attr("fill", d =>
            clusteringAlgorithm === "noClustering"
                ? "steelblue"
                : colorScale(d.community)
        ) // Coloring nodes
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
