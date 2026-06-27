import { loadSiteData } from "../../lib/data";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  return {
    siteData: await loadSiteData(fetch),
  };
};
