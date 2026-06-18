import type { VizFactory } from "../lib/viz/types";

// Lazily-loaded viz modules, one per exercise folder. Each exercise keeps its
// own isolated viz; this registry is the only shared indirection.
const vizModules = import.meta.glob("./*/viz.ts");

/** Dynamically loads the viz factory for the given exercise id. */
export async function loadViz(id: string): Promise<VizFactory> {
  const path = `./${id}/viz.ts`;
  const loader = vizModules[path];
  if (!loader) {
    throw new Error(`No visualization registered for exercise: ${id}`);
  }
  const mod = (await loader()) as { createViz: VizFactory };
  return mod.createViz;
}
