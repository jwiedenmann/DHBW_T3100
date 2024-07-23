function normalize(matrix) {
    const columnSums = matrix.reduce((sums, row) => {
        row.forEach((value, index) => {
            sums[index] = (sums[index] || 0) + value;
        });
        return sums;
    }, []);

    return matrix.map(row =>
        row.map((value, index) => value / (columnSums[index] || 1))
    );
}

function expand(matrix, power) {
    let result = matrix;
    for (let i = 1; i < power; i++) {
        result = multiplyMatrices(result, matrix);
    }
    return result;
}

function inflate(matrix, inflationFactor) {
    return normalize(
        matrix.map(row =>
            row.map(value => Math.pow(value, inflationFactor))
        )
    );
}

function multiplyMatrices(a, b) {
    const result = Array(a.length)
        .fill(null)
        .map(() => Array(b[0].length).fill(0));

    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b[0].length; j++) {
            for (let k = 0; k < b.length; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }

    return result;
}

function hasConverged(a, b, epsilon = 1e-10) {
    return a.every((row, i) =>
        row.every((value, j) => Math.abs(value - b[i][j]) < epsilon)
    );
}

export function mclAlgorithm(graph, expansionPower = 2, inflationFactor = 2) {
    const nodes = graph.nodes();
    const nodeIndex = {};
    nodes.forEach((node, index) => {
        nodeIndex[node] = index;
    });

    let matrix = Array(nodes.length)
        .fill(null)
        .map(() => Array(nodes.length).fill(0));

    graph.forEachEdge((edge, attributes, source, target) => {
        const i = nodeIndex[source];
        const j = nodeIndex[target];
        matrix[i][j] = 1;
        matrix[j][i] = 1;
    });

    matrix = normalize(matrix);

    let previous;
    do {
        previous = matrix;
        matrix = expand(matrix, expansionPower);
        matrix = inflate(matrix, inflationFactor);
    } while (!hasConverged(matrix, previous));

    const clusters = {};
    matrix.forEach((row, i) => {
        row.forEach((value, j) => {
            if (value > 0) {
                if (!clusters[j]) {
                    clusters[j] = [];
                }
                clusters[j].push(nodes[i]);
            }
        });
    });

    const communities = {};
    Object.values(clusters).forEach((cluster, index) => {
        cluster.forEach(node => {
            communities[node] = index;
        });
    });

    console.log(communities);
    return communities;
}
