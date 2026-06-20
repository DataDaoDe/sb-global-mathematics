import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function discoverEntityFiles(
  rootPath: string,
): Promise<string[]> {
  const discoveredFiles: string[] = [];
  await collectEntityFiles(rootPath, discoveredFiles);

  return discoveredFiles.sort();
}

async function collectEntityFiles(
  directoryPath: string,
  discoveredFiles: string[],
): Promise<void> {
  const entries = await readdir(directoryPath, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.name.startsWith("._")) {
      continue;
    }

    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await collectEntityFiles(entryPath, discoveredFiles);
      continue;
    }

    if (entry.isFile() && isYamlFile(entry.name)) {
      discoveredFiles.push(entryPath);
    }
  }
}

function isYamlFile(fileName: string): boolean {
  return fileName.endsWith(".yaml") || fileName.endsWith(".yml");
}
