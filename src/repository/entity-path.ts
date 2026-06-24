import { join, relative } from "node:path";

import type { MathematicalEntity } from "../domain/mathematical-entity.js";

export function expectedEntityPath(
  entity: MathematicalEntity,
  mathematicsRoot: string,
): string {
  switch (entity.kind) {
    case "concept":
      return join(
        mathematicsRoot,
        ...entity.id.split("."),
        "concept.yaml",
      );

    case "definition":
      return expectedDefinitionPath(entity.id, mathematicsRoot);

    case "proposition":
      return expectedScopedEntityPath(
        entity.id,
        ".proposition.",
        "propositions",
        mathematicsRoot,
      );

    case "proof":
      return expectedProofPath(entity.id, mathematicsRoot);

    case "example":
      return expectedScopedEntityPath(
        entity.id,
        ".example.",
        "examples",
        mathematicsRoot,
      );

    case "counterexample":
      return expectedScopedEntityPath(
        entity.id,
        ".counterexample.",
        "counterexamples",
        mathematicsRoot,
      );

    case "question":
      return expectedScopedEntityPath(
        entity.id,
        ".question.",
        "questions",
        mathematicsRoot,
      );

    case "historical_note":
      return expectedScopedEntityPath(
        entity.id,
        ".history.",
        "history",
        mathematicsRoot,
      );

    case "source":
      return join(
        mathematicsRoot,
        "sources",
        `${entity.id.replace(/^source\./, "")}.yaml`,
      );

    case "person":
      return join(
        mathematicsRoot,
        "people",
        `${entity.id.replace(/^person\./, "")}.yaml`,
      );
  }
}

function expectedDefinitionPath(
  id: string,
  mathematicsRoot: string,
): string {
  const variantMarker = ".definition.";
  const variantMarkerIndex = id.indexOf(variantMarker);

  if (variantMarkerIndex !== -1) {
    const conceptId = id.slice(0, variantMarkerIndex);
    const slug = id.slice(variantMarkerIndex + variantMarker.length);

    return join(
      mathematicsRoot,
      ...conceptId.split("."),
      "definitions",
      `${slug}.yaml`,
    );
  }

  return join(
    mathematicsRoot,
    ...id.replace(/\.definition$/, "").split("."),
    "definition.yaml",
  );
}

function expectedProofPath(
  id: string,
  mathematicsRoot: string,
): string {
  const proofMarker = ".proof.";
  const proofMarkerIndex = id.indexOf(proofMarker);

  if (proofMarkerIndex === -1) {
    return join(mathematicsRoot, `${id}.yaml`);
  }

  const propositionId = id.slice(0, proofMarkerIndex);
  const proofSlug = id.slice(proofMarkerIndex + proofMarker.length);
  const propositionMarker = ".proposition.";
  const propositionMarkerIndex = propositionId.indexOf(
    propositionMarker,
  );

  if (propositionMarkerIndex === -1) {
    return join(mathematicsRoot, `${id}.yaml`);
  }

  const conceptId = propositionId.slice(0, propositionMarkerIndex);
  const propositionSlug = propositionId.slice(
    propositionMarkerIndex + propositionMarker.length,
  );

  return join(
    mathematicsRoot,
    ...conceptId.split("."),
    "propositions",
    propositionSlug,
    "proofs",
    `${proofSlug}.yaml`,
  );
}

export function relativeEntityPath(
  filePath: string,
  mathematicsRoot: string,
): string {
  return relative(mathematicsRoot, filePath);
}

function expectedScopedEntityPath(
  id: string,
  marker: string,
  directoryName: string,
  mathematicsRoot: string,
): string {
  const markerIndex = id.indexOf(marker);

  if (markerIndex === -1) {
    return join(mathematicsRoot, `${id}.yaml`);
  }

  const conceptId = id.slice(0, markerIndex);
  const slug = id.slice(markerIndex + marker.length);

  return join(
    mathematicsRoot,
    ...conceptId.split("."),
    directoryName,
    `${slug}.yaml`,
  );
}
