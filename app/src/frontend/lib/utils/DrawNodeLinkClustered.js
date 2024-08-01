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
    const spreadFactor = 1.5;
    const toggleClustering = true;

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
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueCommunities);

    if (toggleClustering) {
        const communityNodes = aggregateCommunities(nodes, uniqueCommunities, nodeLinkSettings.nodeSize);
        const communityLinks = filterAndMapLinks(links, communityNodes);

        runSimulation(communityNodes, communityLinks, nodeLinkSettings, g, width, height, colorScale, tickedAggregated);
    } else {
        runSimulation(nodes, links, nodeLinkSettings, g, width, height, colorScale, ticked);
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

function aggregateCommunities(nodes, uniqueCommunities, nodeSize) {
    return uniqueCommunities.map(community => {
        const communityNodes = nodes.filter(node => node.community === community);
        const centroid = { x: d3.mean(communityNodes, d => d.x), y: d3.mean(communityNodes, d => d.y) };
        const area = d3.sum(communityNodes, () => Math.PI * Math.pow(nodeSize, 2));
        return {
            id: `community-${community}`,
            label: `Community ${community}`,
            community: community,
            x: centroid.x,
            y: centroid.y,
            r: Math.sqrt(area / Math.PI),
            originalNodes: communityNodes.map(n => n.id)
        };
    });
}

function filterAndMapLinks(links, communityNodes) {
    return links.filter(link =>
        communityNodes.some(node => node.originalNodes.includes(link.source) || node.originalNodes.includes(link.target))
    ).map(link => {
        const sourceCommunity = communityNodes.find(node => node.originalNodes.includes(link.source));
        const targetCommunity = communityNodes.find(node => node.originalNodes.includes(link.target));
        return {
            source: sourceCommunity ? sourceCommunity.id : link.source,
            target: targetCommunity ? targetCommunity.id : link.target
        };
    });
}

function runSimulation(nodes, links, settings, g, width, height, colorScale, tickedFunc) {
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(settings.linkDistance))
        .force("charge", d3.forceManyBody().strength(settings.chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.r || settings.collisionRadius))
        .alpha(1).alphaDecay(settings.alphaDecay / 10000)
        .on("tick", tickedFunc);

    g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6)
        .selectAll("line").data(links).enter().append("line").attr("stroke-width", d => Math.sqrt(d.value));

    g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5)
        .selectAll("circle").data(nodes).enter().append("circle")
        .attr("fill", d => colorScale(d.community))
        .attr("r", d => d.r || settings.nodeSize)
        .call(drag(simulation))
        .on("mouseover", handleMouseOver).on("mouseout", handleMouseOut);
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
