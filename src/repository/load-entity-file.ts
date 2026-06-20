import { readFile } from "node:fs/promises";

import { parse as parseYaml } from "yaml";

import {
  parseMathematicalEntity,
  type MathematicalEntity,
} from "../domain/mathematical-entity.js";

export async function loadEntityFile(
  filePath: string,
): Promise<MathematicalEntity> {
  const source = await readFile(filePath, "utf8");
  const data: unknown = parseYaml(source);

  return parseMathematicalEntity(data);
}