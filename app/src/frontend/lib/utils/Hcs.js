import { connectedComponents } from "graphology-components";

export function hcs(graph) {
    const communities = {};
    let communityIndex = 0;

    function recursiveHcs(subgraph) {
        const components = connectedComponents(subgraph);
        if (components.length === 1 && subgraph.order > 1) {
            const cut = findMinCut(subgraph);
            if (cut) {
                const [subgraph1, subgraph2] = cut;
                recursiveHcs(subgraph1);
                recursiveHcs(subgraph2);
            } else {
                assignCommunity(subgraph);
            }
        } else {
            components.forEach((component) => {
                const subgraphComponent = subgraph.copy();
                component.forEach((node) => {
                    if (!subgraph.hasNode(node)) {
                        subgraphComponent.dropNode(node);
                    }
                });
                assignCommunity(subgraphComponent);
            });
        }
    }

    function findMinCut(subgraph) {
        const nodes = subgraph.nodes();
        if (nodes.length <= 2) return null;
        const mid = Math.floor(nodes.length / 2);
        const subgraph1 = subgraph.copy();
        const subgraph2 = subgraph.copy();
        nodes.slice(0, mid).forEach((node) => subgraph2.dropNode(node));
        nodes.slice(mid).forEach((node) => subgraph1.dropNode(node));
        return [subgraph1, subgraph2];
    }

    function assignCommunity(subgraph) {
        subgraph.forEachNode((node) => {
            communities[node] = communityIndex;
        });
        communityIndex++;
    }

    recursiveHcs(graph);
    return communities;
}
