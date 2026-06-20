import type { PageLoad } from "./$types";
import { loadSiteData } from "../../../lib/data";

export const load: PageLoad = async ({ fetch, params }) => {
  return {
    id: params.id,
    siteData: await loadSiteData(fetch),
  };
};
