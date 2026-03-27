"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink } from "@/components/external-link";
import { comparePathFromIds, compareQueryIdsToEntityIds } from "@/lib/entity-utils";
import type { Entity, QaItem } from "@/lib/types";

type ComparePayload = {
  compare: { entity: Entity; qa: QaItem[] }[];
};

export function ComparePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIds = useMemo(() => compareQueryIdsToEntityIds(searchParams.getAll("ids")), [searchParams]);
  const ids = queryIds;
  const [items, setItems] = useState<{ entity: Entity; qa: QaItem[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const hasPickerQuery = searchQuery.trim().length > 0;
  const selectedCount = ids.length;
  const selectedEntityIds = useMemo(() => new Set(ids), [ids]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (!ids.length) {
        setItems([]);
        setCompareError("");
        return;
      }
      setIsCompareLoading(true);
      setCompareError("");
      try {
        const params = new URLSearchParams();
        ids.forEach((id) => params.append("ids", id));
        const response = await fetch(`/api/compare?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Compare fetch failed");
        const payload = (await response.json()) as ComparePayload;
        setItems(payload.compare);
      } catch (error) {
        setItems([]);
        setCompareError(error instanceof Error ? error.message : "Failed to load compare data.");
      } finally {
        setIsCompareLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [ids]);

  useEffect(() => {
    if (pickerSlot === null) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsPickerLoading(true);
      setPickerError("");
      try {
        const query = searchQuery.trim();
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        params.set("limit", "8");
        const response = await fetch(`/api/frameworks?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Memory framework picker fetch failed");
        const payload = (await response.json()) as { frameworks: Entity[] };
        setSearchResults(payload.frameworks);
      } catch (error) {
        setSearchResults([]);
        setPickerError(error instanceof Error ? error.message : "Failed to search memory frameworks.");
      } finally {
        setIsPickerLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [pickerSlot, ids, searchQuery]);

  function updateCompare(nextIds: string[]) {
    router.replace(comparePathFromIds(nextIds), { scroll: false });
  }

  function addEntity(slot: number, entityId: string) {
    const nextIds = [...ids];
    if (slot < nextIds.length) {
      nextIds[slot] = entityId;
    } else {
      nextIds.push(entityId);
    }
    updateCompare(nextIds.slice(0, 3));
    setSearchQuery("");
    setPickerSlot(null);
  }

  function removeEntity(slot: number) {
    updateCompare(ids.filter((_, index) => index !== slot));
  }

  function openSearchDialog(slot: number) {
    setPickerSlot((current) => (current === slot ? null : slot));
    setSearchQuery("");
  }

  function getPreviewAnswer(item: QaItem) {
    if (!item.answer || item.answer === "unknown") {
      return { label: "Unknown", copy: "No extracted answer yet.", answered: false };
    }
    return { label: "Answered", copy: item.answer, answered: true };
  }

  const pickerSurfaceRef = useRef<HTMLDivElement>(null);

  const closePicker = useCallback(() => setPickerSlot(null), []);

  useEffect(() => {
    if (pickerSlot === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closePicker();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerSlot, closePicker]);

  useEffect(() => {
    if (pickerSlot === null) return;
    const el = pickerSurfaceRef.current?.querySelector<HTMLElement>("input");
    el?.focus();
  }, [pickerSlot]);

  useEffect(() => {
    if (pickerSlot === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const root = pickerSurfaceRef.current;
      if (!root) return;
      const list = [...root.querySelectorAll<HTMLElement>("input, button")].filter((node) => {
        if (node instanceof HTMLButtonElement && node.disabled) return false;
        if (node instanceof HTMLInputElement && node.disabled) return false;
        return true;
      });
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    const surface = pickerSurfaceRef.current;
    surface?.addEventListener("keydown", onKeyDown);
    return () => surface?.removeEventListener("keydown", onKeyDown);
  }, [pickerSlot]);

  return (
    <div className="compare-page">
      <nav className="detail-breadcrumb compare-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="detail-breadcrumb-link">
          Home
        </Link>
        <span className="detail-breadcrumb-sep">/</span>
        <span className="detail-breadcrumb-current">Compare</span>
      </nav>

      <section className="compare-header">
        <p className="eyebrow">Workspace</p>
        <h1>Compare memory frameworks</h1>
        <p className="compare-hero-copy">
          Review up to three memory frameworks side by side using repository signals and structured Q&A.
        </p>
        {selectedCount ? <p className="compare-count">{selectedCount} of 3 slots filled</p> : null}
      </section>

      <section className="compare-grid compare-grid-or">
        {isCompareLoading ? <p className="hint">Loading data from database...</p> : null}
        {compareError ? <p className="hint">Failed to load compare data: {compareError}</p> : null}
        {Array.from({ length: 3 }, (_, slot) => {
          const current = items[slot];
          const entity = current?.entity;
          const qa = current?.qa ?? [];
          return (
            <div
              className={`compare-slot compare-slot-or ${entity ? "compare-slot-or--filled" : ""} ${slot > 0 ? "compare-slot-divider" : ""}`}
              key={`slot-${slot}`}
            >
              {entity ? (
                <>
                  <div className="compare-sticky-chrome">
                    <div className={`compare-slot-picker ${pickerSlot === slot ? "open" : ""}`}>
                      <button
                        type="button"
                        className="compare-slot-trigger"
                        onClick={() => openSearchDialog(slot)}
                        aria-expanded={pickerSlot === slot}
                        aria-haspopup="listbox"
                      >
                        <span className="compare-slot-trigger-main">
                          <strong>{entity.name}</strong>
                          <span className="compare-slot-trigger-caret" aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path
                                d="M6 9l6 6 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </span>
                        <span className="compare-slot-trigger-meta">
                          {entity.githubFullName}
                          {entity.language ? ` · ${entity.language}` : ""}
                        </span>
                      </button>
                    </div>
                  </div>
                  <article className="compare-col compare-col-scroll">
                  <Link className="compare-entity-link" href={`/framework/${encodeURIComponent(entity.entityId)}`}>
                    Framework page
                  </Link>
                  <ExternalLink href={entity.githubUrl} className="entity-repo-link compare-repo-link">
                    {entity.githubFullName}
                  </ExternalLink>
                  <p className="compare-description">{entity.description}</p>

                  <div className="compare-section">
                    <span className="compare-section-label">Snapshot</span>
                    <div className="compare-attributes">
                      <div className="compare-attribute">
                        <span>Language</span>
                        <strong>{entity.language ?? "--"}</strong>
                      </div>
                      <div className="compare-attribute">
                        <span>License</span>
                        <strong>{entity.license ?? "--"}</strong>
                      </div>
                      <div className="compare-attribute">
                        <span>arXiv</span>
                        <strong>{entity.arxiv.id ?? entity.arxiv.matchType}</strong>
                      </div>
                      <div className="compare-attribute">
                        <span>GitHub updated</span>
                        <strong>{entity.repoUpdatedAt ? String(entity.repoUpdatedAt).slice(0, 10) : "--"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="compare-section">
                    <span className="compare-section-label">Tags</span>
                    <div className="chip-row">
                      {entity.tags.map((tag) => (
                        <span className="chip" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="compare-section">
                    <span className="compare-section-label">Repository metrics</span>
                    <div className="entity-meta entity-meta-column compare-metrics">
                      <span>Stars: {entity.stats.stars.toLocaleString()}</span>
                      <span>Forks: {entity.stats.forks.toLocaleString()}</span>
                      <span>Issues: {entity.stats.openIssues.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="compare-section">
                    <span className="compare-section-label">Q&A preview</span>
                    <div className="qa-mini-list">
                      {qa.map((item) => {
                        const preview = getPreviewAnswer(item);
                        return (
                          <div key={item.id} className="qa-mini-item">
                            <div className="qa-mini-item-head">
                              <span className="badge">Q{item.id}</span>
                              <span>{item.section}</span>
                              <span className={`qa-status-badge ${preview.answered ? "is-answered" : ""}`}>{preview.label}</span>
                            </div>
                            <p className="qa-mini-question">{item.question}</p>
                            <p className={`qa-mini-answer ${preview.answered ? "" : "is-muted"}`}>{preview.copy}</p>
                          </div>
                        );
                      })}
                      {qa.length === 0 ? (
                        <div className="compare-picker-empty compare-qa-empty">No Q&A items loaded for this memory framework.</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="compare-card-actions compare-card-actions-or">
                    <button type="button" className="link-action compare-remove" onClick={() => removeEntity(slot)}>
                      Remove
                    </button>
                    <Link className="link-action" href={`/framework/${encodeURIComponent(entity.entityId)}`}>
                      View details
                    </Link>
                    <ExternalLink href={entity.githubUrl} className="link-action">
                      GitHub
                    </ExternalLink>
                  </div>
                  </article>
                </>
              ) : (
                <button
                  type="button"
                  className="compare-col compare-placeholder compare-placeholder-trigger"
                  onClick={() => openSearchDialog(slot)}
                  aria-label={`Add framework to column ${slot + 1}`}
                >
                  <div className="compare-plus" aria-hidden="true">
                    +
                  </div>
                  <div className="compare-placeholder-copy">
                    <strong>Add framework</strong>
                    <p>Choose a framework to compare with the other columns.</p>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </section>

      {pickerSlot !== null ? (
        <div className="compare-picker-modal" role="dialog" aria-modal="true" aria-labelledby="compare-picker-title">
          <button type="button" className="compare-picker-backdrop" onClick={closePicker} aria-label="Close picker" />
          <div ref={pickerSurfaceRef} className="compare-picker-surface">
            <p id="compare-picker-title" className="compare-picker-title">
              Select memory framework
            </p>
            <input
              className="search compare-search"
              placeholder="Search memory frameworks"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search memory frameworks to compare"
            />
            <div className="compare-picker-list">
              {isPickerLoading ? <div className="compare-picker-empty">Loading memory frameworks from database...</div> : null}
              {pickerError ? <div className="compare-picker-empty">Failed to load memory frameworks: {pickerError}</div> : null}
              {searchResults.slice(0, 8).map((searchEntity) => {
                const currentSlotId = pickerSlot === null ? null : ids[pickerSlot] ?? null;
                const alreadySelected = selectedEntityIds.has(searchEntity.entityId) && searchEntity.entityId !== currentSlotId;
                return (
                  <button
                    key={`${pickerSlot}-${searchEntity.entityId}`}
                    type="button"
                    className={`compare-picker-item ${alreadySelected ? "is-selected" : ""}`}
                    onClick={() => addEntity(pickerSlot, searchEntity.entityId)}
                    disabled={alreadySelected}
                  >
                    <strong>{searchEntity.name}</strong>
                    <span>
                      {searchEntity.githubFullName}
                      {searchEntity.language ? ` · ${searchEntity.language}` : ""}
                    </span>
                    {alreadySelected ? <em className="compare-picker-status">Already selected</em> : null}
                  </button>
                );
              })}
              {!isPickerLoading && !pickerError && hasPickerQuery && searchResults.length === 0 ? (
                <div className="compare-picker-empty">No matching memory frameworks available.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
