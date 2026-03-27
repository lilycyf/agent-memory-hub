"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EntityIndexList } from "@/components/entity-index-row";
import { EntityTable } from "@/components/entity-table";
import { groupSelectedTagsByCategory, normalizeSelectedTags, TAG_CATEGORY_DEFS } from "@/lib/tag-taxonomy";
import type { Entity, EntityIndexStats } from "@/lib/types";
import type { TagId } from "@/lib/tag-taxonomy";

const PAGE_SIZE = 40;

type Facets = { tags: string[] };

type ApiPayload = {
  frameworks: Entity[];
  hasMore: boolean;
  stats?: EntityIndexStats;
};

export type ModelsPageProps = {
  initialEntities: Entity[];
  initialHasMore: boolean;
  initialFacets: Facets;
  initialStats: EntityIndexStats;
};

export function ModelsPage({
  initialEntities,
  initialHasMore,
  initialFacets,
  initialStats,
}: ModelsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("query") ?? "";
  const selectedTags = useMemo(() => normalizeSelectedTags(searchParams.getAll("tag")), [searchParams]);
  const page = Math.max(1, Number(searchParams.get("p")) || 1);
  const view = searchParams.get("view") === "list" ? "list" : "table";

  const [draftQuery, setDraftQuery] = useState(q);
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [stats, setStats] = useState<EntityIndexStats>(initialStats);
  const [loading, setLoading] = useState(false);

  const groupedVisibleTags = useMemo(
    () =>
      TAG_CATEGORY_DEFS
        .map((group) => ({
          ...group,
          tags: group.tags.filter((item) => initialFacets.tags.includes(item)),
        }))
        .filter((group) => group.tags.length > 0),
    [initialFacets.tags],
  );
  const selectedByCategory = useMemo(() => groupSelectedTagsByCategory(selectedTags), [selectedTags]);

  const requestKey = useMemo(() => JSON.stringify({ q, tags: selectedTags, page }), [q, selectedTags, page]);
  const initialKeyRef = useRef(requestKey);
  const skippedHydrationFetch = useRef(false);

  const replaceQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );


  useEffect(() => {
    setDraftQuery(q);
  }, [q]);

  useEffect(() => {
    if (draftQuery === q) return;
    const timeout = window.setTimeout(() => {
      replaceQuery((params) => {
        const next = draftQuery.trim();
        if (next) params.set("query", next);
        else params.delete("query");
        params.delete("p");
      });
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [draftQuery, q, replaceQuery]);

  useEffect(() => {
    if (!skippedHydrationFetch.current && requestKey === initialKeyRef.current) {
      skippedHydrationFetch.current = true;
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("query", q.trim());
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String((page - 1) * PAGE_SIZE));
        for (const tag of selectedTags) params.append("tag", tag);
        params.set("stats", "1");
        const response = await fetch(`/api/frameworks?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Framework fetch failed");
        const payload = (await response.json()) as ApiPayload;
        setEntities(payload.frameworks);
        setHasMore(payload.hasMore);
        if (payload.stats) setStats(payload.stats);
      } catch {
        // Keep the previous page visible if the request fails.
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [requestKey, q, page, selectedTags]);

  const stateQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("query", q.trim());
    for (const tag of selectedTags) params.append("tag", tag);
    return params.toString();
  }, [q, selectedTags]);

  const hrefFor = useCallback(
    (entity: Entity) =>
      `/framework/${encodeURIComponent(entity.entityId)}${stateQueryString ? `?${stateQueryString}` : ""}`,
    [stateQueryString],
  );

  const activeFilters = useMemo(
    () =>
      [
        q.trim() ? `Search: ${q.trim()}` : null,
        ...selectedTags.map((tag) => `Tag: ${tag}`),
      ].filter(Boolean) as string[],
    [q, selectedTags],
  );

  const empty = entities.length === 0 && !loading;

  function clearGroup(groupTags: string[]) {
    replaceQuery((params) => {
      const nextTags = selectedTags.filter((tag) => !groupTags.includes(tag));
      params.delete("tag");
      nextTags.forEach((tag) => params.append("tag", tag));
      params.delete("p");
    });
  }

  function toggleTag(next: TagId) {
    replaceQuery((params) => {
      const current = new Set(selectedTags);
      if (current.has(next)) current.delete(next);
      else current.add(next);
      params.delete("tag");
      normalizeSelectedTags([...current]).forEach((tag) => params.append("tag", tag));
      params.delete("p");
    });
  }

  function setView(next: "table" | "list") {
    replaceQuery((params) => {
      if (next === "table") params.delete("view");
      else params.set("view", "list");
    });
  }

  function goPage(next: number) {
    replaceQuery((params) => {
      if (next <= 1) params.delete("p");
      else params.set("p", String(next));
    });
  }

  function clearFilters() {
    setDraftQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="page-shell models-page-root models-page-or">
      <section className="models-page-head models-page-head-or">
        <div className="models-head-copy">
          <p className="eyebrow">Memory framework index</p>
          <h1 className="page-title">Memory framework index</h1>
        </div>
      </section>

      <div className="models-page-layout">
        <aside className="models-sidebar">
          <div className="models-sidebar-inner models-sidebar-card">
            <div className="entity-filter-block">
              <span className="entity-filter-label">Tags</span>
              <div className="tag-filter-groups">
                {groupedVisibleTags.map((group) => (
                  <div key={group.id} className="tag-filter-group">
                    <span className="tag-filter-group-label">{group.label}</span>
                    <div className="entity-filter-options">
                      <button
                        className={`filter-item ${(selectedByCategory.get(group.id)?.length ?? 0) === 0 ? "active" : ""}`}
                        onClick={() => clearGroup(group.tags)}
                        type="button"
                      >
                        all
                      </button>
                      {group.tags.map((item) => (
                        <button
                          key={item}
                          className={`filter-item ${selectedTags.includes(item) ? "active" : ""}`}
                          onClick={() => toggleTag(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="entity-filter-block">
              <span className="entity-filter-label">Active scope</span>
              <div className="entity-filter-summary-inline models-filter-summary-grid">
                <span>{stats.paperCount} linked papers</span>
              </div>
              {activeFilters.length ? (
                <button type="button" className="link-action models-clear-filters" onClick={clearFilters}>
                  Clear all filters
                </button>
              ) : null}
            </div>

            {activeFilters.length ? (
              <div className="chip-row compact">
                {activeFilters.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="models-main">
          <div className="models-results-surface panel">
            <div className="models-results-head">
              <div>
                <h2 className="models-results-title">Results</h2>
                <p className="subtle">
                  {loading
                    ? "Refreshing results..."
                    : empty
                      ? "No memory frameworks in the current scope"
                      : `Showing ${entities.length} result(s) on page ${page}${hasMore ? " with more available" : ""}`}
                </p>
              </div>
              <div className="models-results-actions">
                <div className="models-view-toggle" role="group" aria-label="Result layout">
                  <button
                    type="button"
                    className={`models-view-btn ${view === "table" ? "is-active" : ""}`}
                    onClick={() => setView("table")}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    className={`models-view-btn ${view === "list" ? "is-active" : ""}`}
                    onClick={() => setView("list")}
                  >
                    List
                  </button>
                </div>
              <Link className="btn btn-primary-or models-compare-cta" href="/compare">
                Compare frameworks
                </Link>
              </div>
            </div>

            {empty ? (
              <article className="entity-empty panel">
                <h3>No memory frameworks match the current filters.</h3>
                <p>Try broadening the search, clearing filters, or switching tags.</p>
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Reset filters
                </button>
              </article>
            ) : view === "table" ? (
              <EntityTable entities={entities} hrefFor={hrefFor} />
            ) : (
              <EntityIndexList entities={entities} hrefFor={hrefFor} />
            )}

            {!empty ? (
              <nav className="models-pagination" aria-label="Results pages">
                <button
                  type="button"
                  className="btn btn-secondary models-page-btn"
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                >
                  Previous
                </button>
                <span className="models-page-indicator subtle">
                  Page {page}
                  {stats.total ? ` · ${stats.total} total` : ""}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary models-page-btn"
                  disabled={!hasMore}
                  onClick={() => goPage(page + 1)}
                >
                  Next
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
