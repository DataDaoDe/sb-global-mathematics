<script lang="ts">
  import DisplayMath from "./DisplayMath.svelte";
  import EntityLink from "./EntityLink.svelte";
  import TextMath from "./TextMath.svelte";
  import type { EntitySummary, ProofStep } from "../types";

  type Props = {
    readonly steps: readonly ProofStep[];
    readonly index: readonly EntitySummary[];
  };

  let { steps, index }: Props = $props();

  function entityFor(id: string): EntitySummary | undefined {
    return index.find((entry) => entry.id === id);
  }
</script>

<section class="article-section proof-step-section">
  <h2>Proof Steps</h2>

  <ol class="proof-steps">
    {#each steps as step, stepIndex}
      <li class="proof-step">
        <section class="proof-step-content">
          <header class="proof-step-header">
            <span>Step {stepIndex + 1}</span>
            <h3>{step.label}</h3>
          </header>

          <TextMath className="entity-prose" text={step.statement} />

          {#if step.display_math?.length}
            <div class="math-stack proof-step-math">
              {#each step.display_math as expression}
                <DisplayMath expression={expression} />
              {/each}
            </div>
          {/if}
        </section>

        <section class="proof-step-justification">
          <h4>Justification</h4>
          <TextMath className="entity-prose" text={step.justification} />

          {#if step.depends_on?.length}
            <section class="proof-step-dependencies">
              <h4>Uses</h4>
              <div class="proof-step-dependency-list">
                {#each step.depends_on as dependencyId}
                  {@const dependency = entityFor(dependencyId)}
                  {#if dependency}
                    <EntityLink entity={dependency} compact />
                  {:else}
                    <code>{dependencyId}</code>
                  {/if}
                {/each}
              </div>
            </section>
          {/if}
        </section>
      </li>
    {/each}
  </ol>
</section>
