import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

import type { GraphArtifact, GraphEntity } from "../graph/build-graph.js";

export type SqliteExportMetadata = {
  readonly generatedAt: string;
  readonly entityCount: number;
  readonly edgeCount: number;
};

export async function exportSqlite(
  graph: GraphArtifact,
  databasePath: string,
  metadata: SqliteExportMetadata = defaultMetadata(graph),
): Promise<void> {
  await removeSqliteFiles(databasePath);
  await runSqlite(databasePath, buildSql(graph, metadata));
}

function defaultMetadata(graph: GraphArtifact): SqliteExportMetadata {
  return {
    generatedAt: new Date().toISOString(),
    entityCount: graph.entities.length,
    edgeCount: graph.edges.length,
  };
}

async function removeSqliteFiles(databasePath: string): Promise<void> {
  await Promise.all([
    rm(databasePath, {
      force: true,
    }),
    rm(`${databasePath}-shm`, {
      force: true,
    }),
    rm(`${databasePath}-wal`, {
      force: true,
    }),
  ]);
}

function buildSql(
  graph: GraphArtifact,
  metadata: SqliteExportMetadata,
): string {
  return `
    PRAGMA foreign_keys = ON;
    BEGIN TRANSACTION;

    CREATE TABLE metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE entities (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      json TEXT NOT NULL
    );

    CREATE TABLE edges (
      from_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      to_id TEXT NOT NULL,
      PRIMARY KEY (from_id, relation, to_id),
      FOREIGN KEY (from_id) REFERENCES entities(id),
      FOREIGN KEY (to_id) REFERENCES entities(id)
    );

    CREATE TABLE display_math (
      entity_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      latex TEXT NOT NULL,
      description TEXT,
      PRIMARY KEY (entity_id, position),
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE INDEX edges_to_id_relation_idx
      ON edges (to_id, relation);

    CREATE INDEX entities_kind_idx
      ON entities (kind);

    ${metadataRows(metadata)}
    ${entityRows(graph.entities)}
    ${edgeRows(graph)}
    ${displayMathRows(graph.entities)}

    COMMIT;
  `;
}

function metadataRows(metadata: SqliteExportMetadata): string {
  const rows: readonly { readonly key: string; readonly value: string }[] = [
    {
      key: "generated_at",
      value: metadata.generatedAt,
    },
    {
      key: "entity_count",
      value: String(metadata.entityCount),
    },
    {
      key: "edge_count",
      value: String(metadata.edgeCount),
    },
  ];

  return rows
    .map(({ key, value }) =>
      `INSERT INTO metadata (key, value) VALUES (${sqlString(key)}, ${sqlString(value)});`
    )
    .join("\n");
}

function entityRows(entities: readonly GraphEntity[]): string {
  return entities
    .map((entity) =>
      `INSERT INTO entities (id, kind, title, json) VALUES (${sqlString(entity.id)}, ${sqlString(entity.kind)}, ${sqlString(entity.title)}, ${sqlString(JSON.stringify(entity.data))});`
    )
    .join("\n");
}

function edgeRows(graph: GraphArtifact): string {
  return graph.edges
    .map((edge) =>
      `INSERT INTO edges (from_id, relation, to_id) VALUES (${sqlString(edge.from)}, ${sqlString(edge.relation)}, ${sqlString(edge.to)});`
    )
    .join("\n");
}

function displayMathRows(entities: readonly GraphEntity[]): string {
  const rows: string[] = [];

  for (const entity of entities) {
    if (entity.data.kind === "source") {
      continue;
    }

    for (const [position, expression] of entity.data.display_math.entries()) {
      rows.push(
        `INSERT INTO display_math (entity_id, position, latex, description) VALUES (${sqlString(entity.id)}, ${position}, ${sqlString(expression.latex)}, ${sqlNullableString(expression.description)});`,
      );
    }
  }

  return rows.join("\n");
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNullableString(value: string | undefined): string {
  return value === undefined ? "NULL" : sqlString(value);
}

async function runSqlite(
  databasePath: string,
  sql: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn("sqlite3", [databasePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    childProcess.stdout.on("data", (chunk: Buffer) => {
      stdout.push(chunk);
    });
    childProcess.stderr.on("data", (chunk: Buffer) => {
      stderr.push(chunk);
    });
    childProcess.on("error", reject);
    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `sqlite3 exited with code ${code}: ${
            Buffer.concat(stderr).toString("utf8") ||
            Buffer.concat(stdout).toString("utf8")
          }`,
        ),
      );
    });

    childProcess.stdin.end(sql);
  });
}
