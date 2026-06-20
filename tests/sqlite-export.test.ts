import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildGraph,
  exportSqlite,
  loadRepositoryEntities,
  mathematicsPath,
} from "../src/index.js";

const execFileAsync = promisify(execFile);

let temporaryDirectory: string | undefined;

describe("SQLite export", () => {
  afterEach(async () => {
    if (temporaryDirectory !== undefined) {
      await rm(temporaryDirectory, {
        force: true,
        recursive: true,
      });

      temporaryDirectory = undefined;
    }
  });

  it("exports entities, edges, display math, and metadata", async () => {
    temporaryDirectory = await mkdtemp(
      join(tmpdir(), "global-mathematics-"),
    );

    const databasePath = join(
      temporaryDirectory,
      "global-mathematics.sqlite",
    );
    const loadedEntities = await loadRepositoryEntities(mathematicsPath());
    const graph = buildGraph(loadedEntities);

    await exportSqlite(graph, databasePath, {
      generatedAt: "2026-01-01T00:00:00.000Z",
      entityCount: graph.entities.length,
      edgeCount: graph.edges.length,
    });

    expect(
      await singleValue(databasePath, "SELECT COUNT(*) FROM entities"),
    ).toBe(String(graph.entities.length));
    expect(await singleValue(databasePath, "SELECT COUNT(*) FROM edges"))
      .toBe(String(graph.edges.length));
    expect(
      await singleValue(
        databasePath,
        "SELECT value FROM metadata WHERE key = 'generated_at'",
      ),
    ).toBe("2026-01-01T00:00:00.000Z");

    expect(
      await singleValue(
        databasePath,
        "SELECT title FROM entities WHERE id = 'algebra.ring.commutative-unital'",
      ),
    ).toBe("Commutative unital ring");

    expect(
      await singleValue(
        databasePath,
        "SELECT relation FROM edges WHERE from_id = 'algebra.ring.commutative-unital.example.integers' AND to_id = 'algebra.ring.commutative-unital'",
      ),
    ).toBe("example_of");

    expect(
      await singleValue(
        databasePath,
        "SELECT latex FROM display_math WHERE entity_id = 'algebra.ring.commutative-unital' ORDER BY position LIMIT 1",
      ),
    ).toBe("\\forall a,b \\in R,\\; ab = ba");
  });
});

async function singleValue(
  databasePath: string,
  sql: string,
): Promise<string> {
  const { stdout } = await execFileAsync("sqlite3", [
    "-batch",
    "-noheader",
    databasePath,
    sql,
  ]);

  return stdout.trim();
}
