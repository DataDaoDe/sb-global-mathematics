<script lang="ts">
  import TimelinePage from "../../components/TimelinePage.svelte";
  import type { SiteData } from "../../types";

  type Props = {
    readonly data: {
      readonly siteData: SiteData;
    };
  };

  let { data }: Props = $props();
</script>

<TimelinePage siteData={data.siteData} />
