<script lang="ts">
  import HomePage from "../components/HomePage.svelte";
  import type { SiteData } from "../types";

  type Props = {
    readonly data: {
      readonly siteData: SiteData;
    };
  };

  let { data }: Props = $props();
</script>

<HomePage siteData={data.siteData} />
