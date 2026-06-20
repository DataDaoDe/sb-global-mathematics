import { join } from "node:path";

import { validateRepository } from "../repository/validation.js";

const result = await validateRepository(join(process.cwd(), "mathematics"));

if (result.valid) {
  console.log("Repository validation passed.");
} else {
  for (const issue of result.issues) {
    console.error(
      `${issue.code}: ${issue.message} (${issue.filePath})`,
    );
  }

  process.exitCode = 1;
}
