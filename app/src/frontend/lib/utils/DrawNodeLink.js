import * as d3 from "d3";
import Graph from "graphology";

export function drawGraph(
    svg,
    graphResults,
    chargeStrength,
    linkDistance,
    collisionRadius,
    nodeSize,
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

    const simulation = d3
        .forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance))
        .force("charge", d3.forceManyBody().strength(chargeStrength))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(collisionRadius))
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
        .attr("r", nodeSize)
        .attr("fill", "steelblue") // Uniform color for all nodes
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
