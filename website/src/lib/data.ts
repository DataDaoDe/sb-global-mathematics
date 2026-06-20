import type {
  EntityPage,
  Metadata,
  NamespaceTree,
  SearchEntry,
  SiteData,
} from "../types";

const DATA_ROOT = "/data";
type Fetch = typeof fetch;

export async function loadSiteData(fetcher: Fetch = fetch): Promise<SiteData> {
  const [metadata, index, search, tree] = await Promise.all([
    loadJson<Metadata>(fetcher, `${DATA_ROOT}/metadata.json`),
    loadJson<SearchEntry[]>(fetcher, `${DATA_ROOT}/index.json`),
    loadJson<SearchEntry[]>(fetcher, `${DATA_ROOT}/search.json`),
    loadJson<NamespaceTree>(fetcher, `${DATA_ROOT}/tree.json`),
  ]);

  return {
    metadata,
    index,
    search,
    tree,
  };
}

export async function loadEntityPage(
  id: string,
  fetcher: Fetch = fetch,
): Promise<EntityPage> {
  return loadJson<EntityPage>(
    fetcher,
    `${DATA_ROOT}/entities/${encodeURIComponent(id)}.json`,
  );
}

async function loadJson<T>(fetcher: Fetch, url: string): Promise<T> {
  const response = await fetcher(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
