<script lang="ts">
  import TreePage from "../../components/TreePage.svelte";
  import type { SiteData } from "../../types";

  type Props = {
    readonly data: {
      readonly siteData: SiteData;
    };
  };

  let { data }: Props = $props();
</script>

<TreePage siteData={data.siteData} />
