<script lang="ts">
  import EntityPage from "../../../components/EntityPage.svelte";
  import type { SiteData } from "../../../types";

  type Props = {
    readonly data: {
      readonly id: string;
      readonly siteData: SiteData;
    };
  };

  let { data }: Props = $props();
</script>

<EntityPage id={data.id} siteData={data.siteData} />
