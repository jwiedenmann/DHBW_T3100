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

    // Local variable to control the spread and clustering toggle
    const spreadFactor = 1.5; // Increase for more horizontal spread, decrease for more vertical spread
    const toggleClustering = true;

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
        links: Object.values(node.Links).flat().length,
        x: (i % Math.sqrt(graphResults.Nodes.length)) * (width / Math.sqrt(graphResults.Nodes.length)) * spreadFactor,
        y: (Math.floor(i / Math.sqrt(graphResults.Nodes.length))) * (height / Math.sqrt(graphResults.Nodes.length)) / spreadFactor
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
        communities = mclAlgorithm(graph);
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

    if (toggleClustering) {
        // Aggregate nodes into single large nodes for each community
        const communityNodes = uniqueCommunities.map(community => {
            const communityNodes = nodes.filter(node => node.community === community);
            const centroid = {
                x: d3.mean(communityNodes, d => d.x),
                y: d3.mean(communityNodes, d => d.y)
            };
            const area = d3.sum(communityNodes, d => Math.PI * Math.pow(nodeLinkSettings.nodeSize, 2));
            const radius = Math.sqrt(area / Math.PI);
            return {
                id: `community-${community}`,
                label: `Community ${community}`,
                community: community,
                x: centroid.x,
                y: centroid.y,
                r: radius,
                originalNodes: communityNodes.map(n => n.id)
            };
        });

        const communityLinks = links.filter(link =>
            communityNodes.some(node => node.originalNodes.includes(link.source) || node.originalNodes.includes(link.target))
        ).map(link => {
            const sourceCommunity = communityNodes.find(node => node.originalNodes.includes(link.source));
            const targetCommunity = communityNodes.find(node => node.originalNodes.includes(link.target));
            return {
                source: sourceCommunity ? sourceCommunity.id : link.source,
                target: targetCommunity ? targetCommunity.id : link.target
            };
        });

        const simulation = d3
            .forceSimulation(communityNodes)
            .force("link", d3.forceLink(communityLinks).id(d => d.id).distance(nodeLinkSettings.linkDistance))
            .force("charge", d3.forceManyBody().strength(nodeLinkSettings.chargeStrength))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.r))
            .alpha(1)
            .alphaDecay(nodeLinkSettings.alphaDecay / 10000)
            .on("tick", ticked);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r);
        }

        const link = g
            .append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(communityLinks)
            .enter()
            .append("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        const node = g
            .append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(communityNodes)
            .enter()
            .append("circle")
            .attr("fill", d => colorScale(d.community))
            .call(drag(simulation))
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);

        node.append("title").text(d => d.label);
    } else {
        const simulation = d3
            .forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(nodeLinkSettings.linkDistance))
            .force("charge", d3.forceManyBody().strength(nodeLinkSettings.chargeStrength))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(nodeLinkSettings.collisionRadius))
            .alpha(1)
            .alphaDecay(nodeLinkSettings.alphaDecay / 10000)
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
    }

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
