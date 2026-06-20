export const ARTIFACT_SCHEMA_VERSION = 1;

export type ArtifactMetadata = {
  readonly schema_version: number;
  readonly generated_at: string;
  readonly entity_count: number;
  readonly edge_count: number;
};

export function createArtifactMetadata(
  entityCount: number,
  edgeCount: number,
  generatedAt = new Date().toISOString(),
): ArtifactMetadata {
  return {
    schema_version: ARTIFACT_SCHEMA_VERSION,
    generated_at: generatedAt,
    entity_count: entityCount,
    edge_count: edgeCount,
  };
}
