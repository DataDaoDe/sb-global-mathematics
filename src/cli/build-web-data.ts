import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildGraph } from "../graph/build-graph.js";
import {
  loadRepositoryEntities,
  validateEntities,
} from "../repository/validation.js";
import { buildWebData } from "../web-data/build-web-data.js";

const repositoryRoot = process.cwd();
const mathematicsRoot = join(repositoryRoot, "mathematics");
const webRoot = join(repositoryRoot, "generated", "web");
const webEntitiesRoot = join(webRoot, "entities");

const loadedEntities = await loadRepositoryEntities(mathematicsRoot);
const validation = validateEntities(loadedEntities, mathematicsRoot);

if (!validation.valid) {
  for (const issue of validation.issues) {
    console.error(`${issue.code}: ${issue.message} (${issue.filePath})`);
  }

  process.exitCode = 1;
} else {
  const graph = buildGraph(loadedEntities);
  const webData = buildWebData(graph);

  await mkdir(webEntitiesRoot, {
    recursive: true,
  });

  await Promise.all([
    ...webData.pages.map((page) =>
      writeJson(
        join(webEntitiesRoot, `${page.entity.id}.json`),
        page,
      )
    ),
    writeJson(join(webRoot, "metadata.json"), webData.metadata),
    writeJson(join(webRoot, "index.json"), webData.index),
    writeJson(join(webRoot, "search.json"), webData.search),
    writeJson(join(webRoot, "tree.json"), webData.tree),
    writeJson(join(webRoot, "timeline.json"), webData.timeline),
    writeJson(join(webRoot, "graph.json"), webData.graph),
  ]);

  console.log(
    `Web data build complete: ${webData.pages.length} entity pages.`,
  );
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}
