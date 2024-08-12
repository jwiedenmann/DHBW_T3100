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

    function ticked(linkSelection, nodeSelection) {
        updatePositions(linkSelection, nodeSelection, d => d.source.x, d => d.source.y, d => d.target.x, d => d.target.y);
    }

    function tickedAggregated(linkSelection, nodeSelection) {
        updatePositions(linkSelection, nodeSelection, d => d.source.x, d => d.source.y, d => d.target.x, d => d.target.y, d => d.r);

        // Update positions of smaller nodes inside community nodes
        g.selectAll(".small-nodes").each(function (d) {
            const communityNode = d3.select(this).datum();
            d3.select(this)
                .selectAll("circle")
                .attr("cx", staticNode => communityNode.x + staticNode.offsetX)
                .attr("cy", staticNode => communityNode.y + staticNode.offsetY);

            d3.select(this)
                .selectAll("line")
                .attr("x1", link => communityNode.x + link.sourceOffsetX)
                .attr("y1", link => communityNode.y + link.sourceOffsetY)
                .attr("x2", link => communityNode.x + link.targetOffsetX)
                .attr("y2", link => communityNode.y + link.targetOffsetY);
        });
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
    const staticNodesTemplate = [
        { id: 'static-node-1', offsetX: 0, offsetY: 0, r: 5 },
        { id: 'static-node-2', offsetX: 20, offsetY: 20, r: 5 },
        { id: 'static-node-3', offsetX: -20, offsetY: -20, r: 5 }
    ];

    const staticLinksTemplate = [
        { source: 'static-node-1', target: 'static-node-2', sourceOffsetX: 0, sourceOffsetY: 0, targetOffsetX: 20, targetOffsetY: 20 },
        { source: 'static-node-2', target: 'static-node-3', sourceOffsetX: 20, sourceOffsetY: 20, targetOffsetX: -20, targetOffsetY: -20 },
        { source: 'static-node-3', target: 'static-node-1', sourceOffsetX: -20, sourceOffsetY: -20, targetOffsetX: 0, targetOffsetY: 0 }
    ];

    const nodeCountScale = d => Math.sqrt(d.originalNodes ? d.originalNodes.length : 1);

    const chargeStrength = isAggregated
        ? d => settings.chargeStrength * nodeCountScale(d) * -0.5
        : settings.chargeStrength;

    const collisionRadius = isAggregated
        ? d => (d.r || settings.nodeSize) * 0.5 * nodeCountScale(d)
        : settings.collisionRadius;

    const linkDistance = isAggregated
        ? d => settings.linkDistance * nodeCountScale(d.source) * 0.5 * nodeCountScale(d.target)
        : settings.linkDistance;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance))
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(collisionRadius))
        .alpha(1).alphaDecay(settings.alphaDecay / 10000)
        .on("tick", () => {
            tickedFunc(linkSelection, nodeSelection);

            // Update positions of smaller nodes based on community nodes' current position
            g.selectAll(".small-nodes").each(function (d) {
                const communityNode = d;

                d3.select(this).selectAll("circle")
                    .data(staticNodesTemplate)
                    .attr("cx", d => communityNode.x + d.offsetX)
                    .attr("cy", d => communityNode.y + d.offsetY);

                d3.select(this).selectAll("line")
                    .data(staticLinksTemplate)
                    .attr("x1", d => communityNode.x + d.sourceOffsetX)
                    .attr("y1", d => communityNode.y + d.sourceOffsetY)
                    .attr("x2", d => communityNode.x + d.targetOffsetX)
                    .attr("y2", d => communityNode.y + d.targetOffsetY);
            });
        });

    const linkSelection = g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6)
        .selectAll("line").data(links).enter().append("line").attr("stroke-width", d => d.value * d.value);

    const nodeSelection = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5)
        .selectAll("circle").data(nodes).enter().append("circle")
        .attr("fill", d => colorScale(d.originalNodes ? d.originalNodes.length : d.community))
        .attr("stroke", "#fff").attr("stroke-width", 1)
        .attr("r", d => d.r || settings.nodeSize)
        .call(drag(simulation))
        .on("click", (event, d) => handleNodeClick(d))
        .on("mouseover", function (event, d) {
            if (d.originalNodes) {
                // Create a group for the smaller nodes within the community node
                const smallNodeGroup = g.append("g")
                    .attr("class", "small-nodes")
                    .datum(d);

                // Append the smaller nodes as circles
                smallNodeGroup.selectAll("circle")
                    .data(staticNodesTemplate)
                    .enter()
                    .append("circle")
                    .attr("cx", staticNode => d.x + staticNode.offsetX)
                    .attr("cy", staticNode => d.y + staticNode.offsetY)
                    .attr("r", staticNode => staticNode.r)
                    .attr("fill", "red")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1);

                // Append the links between smaller nodes
                smallNodeGroup.selectAll("line")
                    .data(staticLinksTemplate)
                    .enter()
                    .append("line")
                    .attr("x1", link => d.x + link.sourceOffsetX)
                    .attr("y1", link => d.y + link.sourceOffsetY)
                    .attr("x2", link => d.x + link.targetOffsetX)
                    .attr("y2", link => d.y + link.targetOffsetY)
                    .attr("stroke", "#999")
                    .attr("stroke-width", 1);
            }
        })
        .on("mouseout", function () {
            g.selectAll(".small-nodes").remove();
        });

    return { linkSelection, nodeSelection };
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
