import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { buildGraph } from "../graph/build-graph.js";
import {
  loadRepositoryEntities,
  validateEntities,
} from "../repository/validation.js";
import { exportSqlite } from "../sqlite/export-sqlite.js";

const repositoryRoot = process.cwd();
const mathematicsRoot = join(repositoryRoot, "mathematics");
const generatedRoot = join(repositoryRoot, "generated");
const databasePath = join(generatedRoot, "global-mathematics.sqlite");

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

  await exportSqlite(graph, databasePath);

  console.log(
    `SQLite build complete: ${databasePath} (${graph.entities.length} entities, ${graph.edges.length} edges).`,
  );
}
