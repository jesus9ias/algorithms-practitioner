// DFS Graph — a single pure function. Receives a graph as an N×N adjacency
// matrix and returns the depth-first traversal order of node indices
// starting from node 0, using an explicit LIFO stack.

/**
 * @param {number[][]} adjacencyMatrix - N×N matrix where a truthy value at
 *   row i, column j marks an edge between nodes i and j
 * @returns {number[]} node indices in depth-first visit order from node 0
 */
export function dfsGraph(adjacencyMatrix) {
  const nodeCount = adjacencyMatrix.length;
  const order = [];
  if (nodeCount === 0) {
    return order;
  }

  const visited = new Array(nodeCount).fill(false);
  const stack = [0];

  while (stack.length > 0) {
    const node = stack.pop();
    if (visited[node]) {
      continue;
    }
    visited[node] = true;
    order.push(node);

    for (let neighbor = nodeCount - 1; neighbor >= 0; neighbor -= 1) {
      if (adjacencyMatrix[node][neighbor] && !visited[neighbor]) {
        stack.push(neighbor);
      }
    }
  }

  return order;
}
