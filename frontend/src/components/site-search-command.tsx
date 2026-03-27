"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Entity } from "@/lib/types";

export function SiteSearchCommand() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        close();
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        const q = query.trim();
        if (q) params.set("query", q);
        params.set("limit", "6");
        const response = await fetch(`/api/frameworks?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search request failed");
        const payload = (await response.json()) as { frameworks: Entity[] };
        setMatches(payload.frameworks);
      } catch {
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    function onDocMouse(e: MouseEvent) {
      const panel = panelRef.current;
      if (!panel) return;
      if (panel.contains(e.target as Node)) return;
      close();
    }
    document.addEventListener("mousedown", onDocMouse);
    return () => document.removeEventListener("mousedown", onDocMouse);
  }, [close]);

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/framework?query=${encodeURIComponent(q)}` : "/framework");
    close();
  }

  return (
    <div ref={panelRef} className="site-search-command">
      <form className="site-search-bar" role="search" onSubmit={submitSearch}>
        <span className="site-search-bar-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search memory frameworks, repos, or concepts"
          aria-label="Search memory frameworks"
          autoComplete="off"
        />
        <kbd className="site-search-kbd" aria-hidden="true">
          ⌘K
        </kbd>
      </form>

      {open ? (
        <div className="site-search-panel-inline" role="dialog" aria-label="Search results">
          <div className="site-search-results">
            {isLoading ? <p className="site-search-empty">Loading from database...</p> : null}
            {matches.map((entity) => (
              <Link
                key={entity.entityId}
                href={`/framework/${encodeURIComponent(entity.entityId)}`}
                className="site-search-item"
                onClick={close}
              >
                <strong>{entity.name}</strong>
                <span>{entity.githubFullName}</span>
              </Link>
            ))}
            {matches.length === 0 ? <p className="site-search-empty">No matches.</p> : null}
          </div>
          <div className="site-search-footer">
            <Link
              href={query.trim() ? `/framework?query=${encodeURIComponent(query.trim())}` : "/framework"}
              className="link-action"
              onClick={close}
            >
              {pathname === "/framework" ? "Refresh current results" : "Open full framework index"}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
