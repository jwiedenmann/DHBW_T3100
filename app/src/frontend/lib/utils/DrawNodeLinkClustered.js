import * as d3 from "d3";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { hcs } from "./hcs";
import { mclAlgorithm } from "./mcl"; // Import the MCL algorithm

let originalLinksStore = [];

export function drawGraph(
    svg,
    graphResults,
    nodeLinkSettings,
    updateMetrics,
    handleNodeClick
) {
    if (originalLinksStore) originalLinksStore = [];
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
        // g.selectAll(".small-nodes").each(function (d) {
        //     const communityNode = d3.select(this).datum();
        //     d3.select(this)
        //         .selectAll("circle")
        //         .attr("cx", staticNode => communityNode.x + staticNode.offsetX)
        //         .attr("cy", staticNode => communityNode.y + staticNode.offsetY);

        //     d3.select(this)
        //         .selectAll("line")
        //         .attr("x1", link => communityNode.x + link.sourceOffsetX)
        //         .attr("y1", link => communityNode.y + link.sourceOffsetY)
        //         .attr("x2", link => communityNode.x + link.targetOffsetX)
        //         .attr("y2", link => communityNode.y + link.targetOffsetY);
        // });
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
    const links = nodes.flatMap((node) =>
        Object.entries(node.Links).flatMap(([key, values]) =>
            values.map((value) => {
                // Check if the value is an object, if so, try to extract a meaningful string identifier
                let targetValue;
                if (typeof value === 'object' && value !== null) {
                    // Attempt to get an ID or URI from the object, or convert to string
                    targetValue = value.Uri || JSON.stringify(value);
                } else {
                    targetValue = value;
                }

                const edgeKey = `${node.Uri}-${targetValue}`;
                if (!edgeSet.has(edgeKey)) {
                    edgeSet.add(edgeKey);
                    originalLinksStore.push({ source: node.Uri, target: targetValue, predicate: key }); // Add to global store
                    return { source: node.Uri, target: targetValue, predicate: key };
                }
                return null;
            }).filter(Boolean)
        )
    );

    return links;
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
    // Main force simulation for community nodes
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

                // Update the force simulation for the smaller nodes
                const smallNodes = d3.select(this).selectAll("circle").data();
                const communityNodeIds = new Set(smallNodes.map(node => node.id));
                // Ensure we are working with a copy of the originalLinksStore data to avoid mutations
                const communityLinks = originalLinksStore.map(link => ({
                    source: link.source,
                    target: link.target,
                    predicate: link.predicate
                })).filter(link =>
                    communityNodeIds.has(link.source) && communityNodeIds.has(link.target)
                );

                const smallNodeSimulation = d3.forceSimulation(smallNodes)
                    .force("center", d3.forceCenter(communityNode.x, communityNode.y))
                    .force("charge", d3.forceManyBody().strength(-30))  // Keep the nodes close
                    .force("collision", d3.forceCollide().radius(5))
                    .force("link", d3.forceLink(communityLinks).id(d => d.id).distance(20))
                    .on("tick", () => {
                        d3.select(this).selectAll("circle")
                            .attr("cx", d => d.x)
                            .attr("cy", d => d.y);

                        d3.select(this).selectAll("line")
                            .attr("x1", d => d.source.x)
                            .attr("y1", d => d.source.y)
                            .attr("x2", d => d.target.x)
                            .attr("y2", d => d.target.y);
                    });

                smallNodeSimulation.alpha(0.3).restart(); // Maintain an active simulation
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
                // Remove any existing small nodes group
                g.selectAll(".small-nodes").remove();

                const smallNodeGroup = g.append("g")
                    .attr("class", "small-nodes")
                    .datum(d);

                const communityNodes = d.originalNodes;
                const communityNodeIds = new Set(communityNodes.map(node => node.id));

                // Ensure we are working with a copy of the originalLinksStore data to avoid mutations
                let communityLinks = originalLinksStore.map(link => ({
                    source: link.source,
                    target: link.target,
                    predicate: link.predicate
                })).filter(link => {
                    return communityNodeIds.has(link.source) && communityNodeIds.has(link.target);
                });

                // Append circles for community nodes
                smallNodeGroup.selectAll("circle")
                    .data(communityNodes)
                    .enter()
                    .append("circle")
                    .attr("r", settings.nodeSize) // Set radius
                    .attr("cx", node => node.x)
                    .attr("cy", node => node.y)
                    .attr("fill", node => colorScale(node.community))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1);

                // Append lines for community links
                smallNodeGroup.selectAll("line")
                    .data(communityLinks)
                    .enter()
                    .append("line")
                    .attr("stroke", "#999")
                    .attr("stroke-width", 1)
                    .attr("x1", link => communityNodes.find(node => node.id === link.source).x)
                    .attr("y1", link => communityNodes.find(node => node.id === link.source).y)
                    .attr("x2", link => communityNodes.find(node => node.id === link.target).x)
                    .attr("y2", link => communityNodes.find(node => node.id === link.target).y);

                // Initialize the force simulation for the smaller nodes
                const smallNodeSimulation = d3.forceSimulation(communityNodes)
                    .force("center", d3.forceCenter(d.x, d.y))
                    .force("charge", d3.forceManyBody().strength(-30))  // Keep the nodes close
                    .force("collision", d3.forceCollide().radius(settings.nodeSize))
                    .force("link", d3.forceLink(communityLinks).id(d => d.id).distance(20))
                    .on("tick", () => {
                        smallNodeGroup.selectAll("circle")
                            .attr("cx", d => d.x)
                            .attr("cy", d => d.y);

                        smallNodeGroup.selectAll("line")
                            .attr("x1", d => d.source.x)
                            .attr("y1", d => d.source.y)
                            .attr("x2", d => d.target.x)
                            .attr("y2", d => d.target.y);
                    });

                smallNodeSimulation.alpha(0.3).restart(); // Maintain an active simulation
            }
        })
        .on("mouseout", function () {
            // Properly remove the small nodes group on mouseout
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
