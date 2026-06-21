<script lang="ts">
  import type { Entity } from "../types";

  type Detail = {
    readonly label: string;
    readonly value: string;
  };

  type Props = {
    readonly entity: Entity;
  };

  let { entity }: Props = $props();
  const details = $derived(buildDetails(entity));

  function buildDetails(candidate: Entity): readonly Detail[] {
    return [
      detail("Source type", stringField(candidate, "source_type")),
      detail("Authors", stringArrayField(candidate, "authors")?.join(", ")),
      detail("Year", numberField(candidate, "year")?.toString()),
      detail("DOI", stringField(candidate, "doi")),
      detail("ISBN", stringField(candidate, "isbn")),
      detail("Locator", stringField(candidate, "locator")),
      detail("Definition role", stringField(candidate, "definition_role")),
      detail("Definition style", stringField(candidate, "definition_style")),
      detail("Scope", stringField(candidate, "scope")),
      detail("Proposition type", stringField(candidate, "proposition_type")),
      detail("Proof method", stringField(candidate, "method")),
      detail("Date", stringField(candidate, "date_label")),
    ].filter((item): item is Detail => item !== null);
  }

  function detail(label: string, value: string | undefined): Detail | null {
    if (value === undefined || value.trim() === "") {
      return null;
    }

    return {
      label,
      value,
    };
  }

  function stringField(candidate: Entity, fieldName: string): string | undefined {
    const value = candidate[fieldName];
    return typeof value === "string" ? value : undefined;
  }

  function numberField(candidate: Entity, fieldName: string): number | undefined {
    const value = candidate[fieldName];
    return typeof value === "number" ? value : undefined;
  }

  function stringArrayField(
    candidate: Entity,
    fieldName: string,
  ): readonly string[] | undefined {
    const value = candidate[fieldName];

    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
      return undefined;
    }

    return value;
  }
</script>

{#if details.length > 0}
  <dl class="entity-details">
    {#each details as item}
      <div>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>
    {/each}
  </dl>
{/if}
