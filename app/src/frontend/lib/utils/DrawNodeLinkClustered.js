import * as d3 from "d3";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { hcs } from "./hcs";
import { mclAlgorithm } from "./mcl"; // Import the MCL algorithm

export function drawGraph(
    svg,
    graphResults,
    nodeLinkSettings,
    updateMetrics,
    handleNodeClick
) {
    if (!svg) return;

    const container = d3.select(svg.parentNode);
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    const spreadFactor = 1.5;

    // Set up SVG canvas
    const svgSelection = d3.select(svg).attr("viewBox", [0, 0, width, height]).attr("width", width).attr("height", height);
    svgSelection.selectAll("*").remove();

    const g = svgSelection.append("g");
    svgSelection.call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)));

    // Prepare nodes and links
    const nodes = graphResults.Nodes.map((node, i) => ({
        id: node.Uri,
        label: node.Label,
        properties: node.Properties,
        links: Object.values(node.Links).flat().length,
        x: (i % Math.sqrt(graphResults.Nodes.length)) * (width / Math.sqrt(graphResults.Nodes.length)) * spreadFactor,
        y: (Math.floor(i / Math.sqrt(graphResults.Nodes.length))) * (height / Math.sqrt(graphResults.Nodes.length)) / spreadFactor
    }));

    const links = createLinks(graphResults.Nodes);
    const graph = new Graph();
    nodes.forEach((node) => graph.addNode(node.id, node));
    links.forEach((link) => graph.addEdge(link.source, link.target));

    const communities = getCommunities(graph, nodeLinkSettings.clusteringAlgorithm);
    nodes.forEach((node) => node.community = communities[node.id]);

    const uniqueCommunities = [...new Set(Object.values(communities))];

    let colorScale;

    if (nodeLinkSettings.combineNodeClusters) {
        const communityNodes = aggregateCommunities(nodes, uniqueCommunities, nodeLinkSettings);

        // Define color scale based on the number of nodes in each community
        const nodeCountExtent = d3.extent(communityNodes, d => d.originalNodes.length);
        colorScale = d3.scaleLinear()
            .domain(nodeCountExtent)
            .range(["#FCA728", "#E91E64"]);

        const communityLinks = filterAndMapLinks(links, communityNodes);

        runSimulation(communityNodes, communityLinks, nodeLinkSettings, g, width, height, colorScale, tickedAggregated, true, handleNodeClick);
    } else {
        // Define color scale based on community for individual nodes
        colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueCommunities);
        runSimulation(nodes, links, nodeLinkSettings, g, width, height, colorScale, ticked, false, handleNodeClick);
    }

    function ticked() {
        updatePositions(g.selectAll("line"), g.selectAll("circle"), d => d.source.x, d => d.source.y, d => d.target.x, d => d.target.y);
    }

    function tickedAggregated() {
        updatePositions(g.selectAll("line"), g.selectAll("circle"), d => d.source.x, d => d.source.y, d => d.target.x, d => d.target.y, d => d.r);
    }

    calculateFPS(updateMetrics, nodes.length, links.length);

    function updatePositions(linkSelection, nodeSelection, x1Func, y1Func, x2Func, y2Func, rFunc = null) {
        linkSelection.attr("x1", x1Func).attr("y1", y1Func).attr("x2", x2Func).attr("y2", y2Func);
        nodeSelection.attr("cx", d => d.x).attr("cy", d => d.y);
        if (rFunc) nodeSelection.attr("r", rFunc);
    }
}

function createLinks(nodes) {
    const edgeSet = new Set();
    return nodes.flatMap((node) =>
        Object.entries(node.Links).flatMap(([key, values]) =>
            values.map((value) => {
                const edgeKey = `${node.Uri}-${value}`;
                if (!edgeSet.has(edgeKey)) {
                    edgeSet.add(edgeKey);
                    return { source: node.Uri, target: value, predicate: key };
                }
                return null;
            }).filter(Boolean)
        )
    );
}

function getCommunities(graph, algorithm) {
    switch (algorithm) {
        case "louvain":
            return louvain(graph);
        case "hcs":
            return hcs(graph);
        case "mcl":
            return mclAlgorithm(graph);
        default:
            return graph.nodes().reduce((acc, id, index) => ({ ...acc, [id]: index }), {});
    }
}

function aggregateCommunities(nodes, uniqueCommunities, settings) {
    return uniqueCommunities.map(community => {
        const communityNodes = nodes.filter(node => node.community === community);
        const centroid = { x: d3.mean(communityNodes, d => d.x), y: d3.mean(communityNodes, d => d.y) };
        const nodeCount = communityNodes.length;

        // Base area for nodes
        const baseArea = nodeCount * Math.PI * Math.pow(settings.nodeSize, 2);

        // Scaled influence of link spacing, charge repulsion, and collision area
        const linkSpacingArea = nodeCount * settings.linkDistance * settings.nodeSize;
        const chargeRepulsionArea = nodeCount * Math.abs(settings.chargeStrength) * 0.5 * Math.pow(settings.nodeSize, 2);
        const collisionArea = nodeCount * Math.pow(settings.collisionRadius, 2) * 0.5;

        // Total area with adjusted scaling factors to avoid excessive inflation
        const totalEffectiveArea = baseArea + linkSpacingArea + chargeRepulsionArea + collisionArea;

        // Calculating the radius from the total area
        const effectiveRadius = Math.sqrt(totalEffectiveArea / Math.PI);

        return {
            id: `community-${community}`,
            label: `Community ${community}`,
            community: community,
            x: centroid.x,
            y: centroid.y,
            r: effectiveRadius,
            originalNodes: communityNodes
        };
    });
}

function filterAndMapLinks(links, communityNodes) {
    const communityLinkMap = new Map();

    links.forEach(link => {
        const sourceCommunity = communityNodes.find(node => node.originalNodes.map(n => n.id).includes(link.source));
        const targetCommunity = communityNodes.find(node => node.originalNodes.map(n => n.id).includes(link.target));

        if (sourceCommunity && targetCommunity) {
            const key = `${sourceCommunity.id}|${targetCommunity.id}`;

            if (communityLinkMap.has(key)) {
                communityLinkMap.set(key, communityLinkMap.get(key) + 1);
            } else {
                communityLinkMap.set(key, 1);
            }
        }
    });

    return Array.from(communityLinkMap.entries()).map(([key, weight]) => {
        const [source, target] = key.split('|');
        return { source, target, value: weight };
    });
}

function runSimulation(nodes, links, settings, g, width, height, colorScale, tickedFunc, isAggregated, handleNodeClick) {
    // Define scaling factors based on the number of nodes in a community
    const nodeCountScale = d => Math.sqrt(d.originalNodes ? d.originalNodes.length : 1);

    // Adjust forces based on the size of the communities
    const chargeStrength = isAggregated
        ? d => settings.chargeStrength * nodeCountScale(d) * -0.5  // More negative for larger communities
        : settings.chargeStrength;

    const collisionRadius = isAggregated
        ? d => (d.r || settings.nodeSize) * 0.5 * nodeCountScale(d) // Larger collision radius for larger communities
        : settings.collisionRadius;

    const linkDistance = isAggregated
        ? d => settings.linkDistance * nodeCountScale(d.source) * 0.5 * nodeCountScale(d.target) // Adjust link distance based on size of connected nodes
        : settings.linkDistance;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance)) // Increase link strength
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(collisionRadius))
        .alpha(1).alphaDecay(settings.alphaDecay / 10000)
        .on("tick", tickedFunc);

    g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6)
        .selectAll("line").data(links).enter().append("line").attr("stroke-width", d => d.value * d.value); // Make links thicker

    g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5)
        .selectAll("circle").data(nodes).enter().append("circle")
        .attr("fill", d => colorScale(d.originalNodes ? d.originalNodes.length : d.community))
        .attr("stroke", "#fff").attr("stroke-width", 1) // Draw a thin white border around nodes
        .attr("r", d => d.r || settings.nodeSize)
        .call(drag(simulation))
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", (event, d) => handleNodeClick(d));
}

function drag(simulation) {
    return d3.drag().on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }).on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }).on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    });
}

function handleMouseOver(event, d) {
    const tooltip = d3.select("#tooltip").transition().duration(200).style("opacity", 0.9);
    tooltip.html(
        `<div><strong>URI:</strong> <span class="nowrap">${d.id}</span></div>
        <div><strong>Label:</strong> ${d.label}</div>
        <div><strong>Properties:</strong> ${JSON.stringify(d.properties)}</div>`
    ).style("left", event.pageX + 5 + "px").style("top", event.pageY - 28 + "px");
}

function handleMouseOut() {
    d3.select("#tooltip").transition().duration(500).style("opacity", 0);
}

function calculateFPS(updateMetrics, nodesCount, linksCount) {
    let lastFrameTime = Date.now();
    let frameCount = 0;

    function measureFPS() {
        frameCount++;
        const now = Date.now();
        const delta = (now - lastFrameTime) / 1000;

        if (delta >= 1) {
            const fps = frameCount / delta;
            updateMetrics(nodesCount, linksCount, fps);
            frameCount = 0;
            lastFrameTime = now;
        }

        requestAnimationFrame(measureFPS);
    }

    measureFPS();
}
