import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildGraph } from "../graph/build-graph.js";
import {
  loadRepositoryEntities,
  validateEntities,
} from "../repository/validation.js";

const repositoryRoot = process.cwd();
const mathematicsRoot = join(repositoryRoot, "mathematics");
const generatedRoot = join(repositoryRoot, "generated");

const loadedEntities = await loadRepositoryEntities(mathematicsRoot);
const validation = validateEntities(loadedEntities, mathematicsRoot);

if (!validation.valid) {
  for (const issue of validation.issues) {
    console.error(`${issue.code}: ${issue.message} (${issue.filePath})`);
  }

  process.exitCode = 1;
} else {
  const graph = buildGraph(loadedEntities);

  await mkdir(generatedRoot, {
    recursive: true,
  });

  await Promise.all([
    writeJson(join(generatedRoot, "entities.json"), graph.entities),
    writeJson(join(generatedRoot, "edges.json"), graph.edges),
    writeJson(join(generatedRoot, "graph.json"), graph),
  ]);

  console.log(
    `Graph build complete: ${graph.entities.length} entities, ${graph.edges.length} edges.`,
  );
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}
