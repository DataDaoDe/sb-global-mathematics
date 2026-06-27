<script lang="ts">
  import GraphPage from "../../components/GraphPage.svelte";
  import type { SiteData } from "../../types";

  type Props = {
    readonly data: {
      readonly siteData: SiteData;
    };
  };

  let { data }: Props = $props();
</script>

<GraphPage siteData={data.siteData} />
