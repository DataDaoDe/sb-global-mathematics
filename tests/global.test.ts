import { describe, expect, it } from "vitest";

import { repositoryName } from "../src/index.js";

describe("repository", () => {
  it("loads the global mathematics library", () => {
    expect(repositoryName).toBe("global-mathematics");
  });
});