// BFS Graph — a single pure function. Receives a graph as an N×N adjacency
// matrix and returns the breadth-first traversal order of node indices
// starting from node 0, using an explicit FIFO queue.

/**
 * @param {number[][]} adjacencyMatrix - N×N matrix where a truthy value at
 *   row i, column j marks an edge between nodes i and j
 * @returns {number[]} node indices in breadth-first visit order from node 0
 */
export function bfsGraph(adjacencyMatrix) {
  const nodeCount = adjacencyMatrix.length;
  const order = [];
  if (nodeCount === 0) {
    return order;
  }

  const visited = new Array(nodeCount).fill(false);
  const queue = [0];
  visited[0] = true;

  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);

    for (let neighbor = 0; neighbor < nodeCount; neighbor += 1) {
      if (adjacencyMatrix[node][neighbor] && !visited[neighbor]) {
        visited[neighbor] = true;
        queue.push(neighbor);
      }
    }
  }

  return order;
}
