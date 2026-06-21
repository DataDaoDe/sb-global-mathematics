import { loadSiteData } from "../../lib/data";

export async function load({ fetch }) {
  return {
    siteData: await loadSiteData(fetch),
  };
}
