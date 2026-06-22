import { beforeAll, describe, expect, it } from "vitest";

import {
  SourceSchema,
  SourceDoiSchema,
  SourceIsbnSchema,
  SourceTypeSchema,
  isSource,
  loadEntityFile,
  mathematicsPath,
  parseSource,
  type Source,
} from "../src/index.js";

const sourceFile = mathematicsPath(
  "sources",
  "dummit-foote-abstract-algebra-third-edition.yaml",
);

describe("SourceType", () => {
  it.each([
    "book",
    "paper",
    "manuscript",
    "lecture",
    "formal-library",
    "encyclopedia",
    "web-page",
  ])("accepts valid source type: %s", (sourceType) => {
    expect(SourceTypeSchema.safeParse(sourceType).success).toBe(true);
  });

  it.each([
    "blog",
    "Book",
    "",
  ])("rejects unsupported source type: %s", (sourceType) => {
    expect(SourceTypeSchema.safeParse(sourceType).success).toBe(false);
  });
});

describe("SourceDoi", () => {
  it("accepts a DOI-like identifier", () => {
    expect(SourceDoiSchema.safeParse("10.1000/example.doi").success)
      .toBe(true);
  });

  it.each([
    "doi:10.1000/example",
    "1000/example",
    "",
  ])("rejects unsupported DOI value: %s", (doi) => {
    expect(SourceDoiSchema.safeParse(doi).success).toBe(false);
  });
});

describe("SourceIsbn", () => {
  it.each([
    "0471433349",
    "978-0-471-43334-7",
  ])("accepts ISBN-like identifier: %s", (isbn) => {
    expect(SourceIsbnSchema.safeParse(isbn).success).toBe(true);
  });

  it.each([
    "isbn 0471433349",
    "abc",
    "",
  ])("rejects unsupported ISBN value: %s", (isbn) => {
    expect(SourceIsbnSchema.safeParse(isbn).success).toBe(false);
  });
});

describe("Source", () => {
  let source: Source;

  beforeAll(async () => {
    source = parseSource(await loadEntityFile(sourceFile));
  });

  it("loads a concrete source from the repository", () => {
    expect(source).toEqual({
      id: "source.dummit-foote-abstract-algebra-third-edition",
      kind: "source",
      title: "Abstract Algebra, Third Edition",
      source_type: "book",
      authors: [
        "David S. Dummit",
        "Richard M. Foote",
      ],
      year: 2004,
    });
  });

  it("represents a valid Source", () => {
    expect(SourceSchema.safeParse(source).success).toBe(true);
    expect(isSource(source)).toBe(true);
  });

  it("can be parsed through the domain parser", () => {
    expect(parseSource(source)).toEqual(source);
  });

  it("rejects an empty author", () => {
    const result = SourceSchema.safeParse({
      ...source,
      authors: [""],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid year", () => {
    const result = SourceSchema.safeParse({
      ...source,
      year: 10000,
    });

    expect(result.success).toBe(false);
  });

  it("accepts BCE source years for ancient works", () => {
    const result = SourceSchema.safeParse({
      ...source,
      id: "source.example-ancient-work",
      year: -350,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty locator", () => {
    const result = SourceSchema.safeParse({
      ...source,
      locator: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts optional DOI and ISBN fields", () => {
    const result = SourceSchema.safeParse({
      ...source,
      doi: "10.1000/example.doi",
      isbn: "978-0-471-43334-7",
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown fields", () => {
    const result = SourceSchema.safeParse({
      ...source,
      publisher: "Example Publisher",
    });

    expect(result.success).toBe(false);
  });
});
