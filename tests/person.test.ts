import { beforeAll, describe, expect, it } from "vitest";

import {
  PersonSchema,
  isPerson,
  loadEntityFile,
  mathematicsPath,
  parsePerson,
  type Person,
} from "../src/index.js";

const personFile = mathematicsPath(
  "people",
  "kurt-goedel.yaml",
);

describe("Person", () => {
  let person: Person;

  beforeAll(async () => {
    person = parsePerson(await loadEntityFile(personFile));
  });

  it("loads a concrete person from the repository", () => {
    expect(person).toEqual({
      id: "person.kurt-goedel",
      kind: "person",
      title: "Kurt Gödel",
      sort_name: "Godel, Kurt",
      birth_year: 1906,
      death_year: 1978,
      source_refs: [
        {
          source: "source.goedel-1930-completeness",
          locator: "Author metadata",
          note: "Source authored by Kurt Gödel.",
        },
        {
          source: "source.goedel-1931-incompleteness",
          locator: "Author metadata",
          note: "Source authored by Kurt Gödel.",
        },
        {
          source: "source.goedel-1940-consistency-continuum-hypothesis",
          locator: "Author metadata",
          note: "Source authored by Kurt Gödel.",
        },
      ],
    });
  });

  it("represents a valid Person", () => {
    expect(PersonSchema.safeParse(person).success).toBe(true);
    expect(isPerson(person)).toBe(true);
  });

  it("rejects death years earlier than birth years", () => {
    const result = PersonSchema.safeParse({
      ...person,
      death_year: 1900,
    });

    expect(result.success).toBe(false);
  });
});
