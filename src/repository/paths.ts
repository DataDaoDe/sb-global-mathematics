import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const REPOSITORY_ROOT = fileURLToPath(
  new URL("../../", import.meta.url),
);

export const MATHEMATICS_ROOT = join(
  REPOSITORY_ROOT,
  "mathematics",
);

export function mathematicsPath(
  ...segments: string[]
): string {
  return join(MATHEMATICS_ROOT, ...segments);
}