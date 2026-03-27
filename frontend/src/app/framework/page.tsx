import { Suspense } from "react";
import { ModelsPage } from "@/components/models-page";
import { getEntityIndexStats, listEntitiesPaged, listEntityFacets } from "@/lib/repository";

const PAGE_SIZE = 40;

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string): string {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return typeof v === "string" ? v : "";
}

type FrameworkIndexPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function FrameworkIndexPage({ searchParams }: FrameworkIndexPageProps) {
  const sp = await searchParams;
  const query = pick(sp, "query");
  const tagValue = sp.tag;
  const tags = Array.isArray(tagValue) ? tagValue : tagValue ? [tagValue] : [];
  const page = Math.max(1, Number(pick(sp, "p")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [facets, pageData, stats] = await Promise.all([
    listEntityFacets(),
    listEntitiesPaged({
      query,
      limit: PAGE_SIZE,
      offset,
      tags,
    }),
    getEntityIndexStats(query, tags),
  ]);

  return (
    <Suspense fallback={<div className="page-shell"><p className="hint">Loading...</p></div>}>
      <ModelsPage
        initialEntities={pageData.entities}
        initialHasMore={pageData.hasMore}
        initialFacets={facets}
        initialStats={stats}
      />
    </Suspense>
  );
}
