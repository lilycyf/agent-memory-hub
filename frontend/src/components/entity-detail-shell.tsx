"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, type KeyboardEvent, type ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";

const ENTITY_DETAIL_TABS = ["overview", "data-flow", "qa"] as const;

export type BreadcrumbItem = { label: string; href?: string };
type SummaryItem = { label: string; value: string };

type EntityDetailShellProps = {
  breadcrumb: BreadcrumbItem[];
  entityIdLine: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  compareHref: string;
  backHref: string;
  externalLinks: { label: string; href: string }[];
  summaryItems: SummaryItem[];
  metaStrip: ReactNode;
  overviewPanel: ReactNode;
  dataFlowPanel: ReactNode;
  qaPanel: ReactNode;
};

export function EntityDetailShell({
  breadcrumb,
  entityIdLine,
  title,
  subtitle,
  description,
  tags,
  compareHref,
  backHref,
  externalLinks,
  summaryItems,
  metaStrip,
  overviewPanel,
  dataFlowPanel,
  qaPanel,
}: EntityDetailShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: "overview" | "data-flow" | "qa" =
    tabParam === "qa"
      ? "qa"
      : tabParam === "data-flow" || tabParam === "diagrams"
        ? "data-flow"
        : "overview";

  const setTabAndUrl = useCallback(
    (next: "overview" | "data-flow" | "qa") => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "overview") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTabIndex = useCallback((index: number) => {
    requestAnimationFrame(() => tabRefs.current[index]?.focus());
  }, []);

  const onTabListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const i = ENTITY_DETAIL_TABS.indexOf(tab);
      if (i < 0) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const next = ENTITY_DETAIL_TABS[(i + 1) % ENTITY_DETAIL_TABS.length];
        setTabAndUrl(next);
        focusTabIndex(ENTITY_DETAIL_TABS.indexOf(next));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = ENTITY_DETAIL_TABS[(i - 1 + ENTITY_DETAIL_TABS.length) % ENTITY_DETAIL_TABS.length];
        setTabAndUrl(next);
        focusTabIndex(ENTITY_DETAIL_TABS.indexOf(next));
      } else if (event.key === "Home") {
        event.preventDefault();
        setTabAndUrl("overview");
        focusTabIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setTabAndUrl("qa");
        focusTabIndex(ENTITY_DETAIL_TABS.length - 1);
      }
    },
    [tab, setTabAndUrl, focusTabIndex],
  );

  return (
    <>
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        {breadcrumb.map((item, i) => (
          <span key={`${item.label}-${i}`}>
            {i > 0 ? <span className="detail-breadcrumb-sep">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="detail-breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="detail-breadcrumb-current">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <header className="entity-hero detail-header">
        <div className="entity-hero-copy">
          <p className="entity-id-line">{entityIdLine}</p>
          <p className="eyebrow">Memory framework</p>
          <h1>{title}</h1>
          <div className="entity-subtitle">{subtitle}</div>
          <p className="entity-hero-description">{description}</p>
          <div className="chip-row">
            {tags.map((tag) => (
              <span className="chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="entity-hero-actions entity-hero-actions-or">
          <div className="entity-summary-grid">
            {summaryItems.map((item) => (
              <div key={item.label} className="entity-summary-item">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <Link className="btn btn-primary-or" href={compareHref}>
            Compare
          </Link>
          <Link className="link-action" href={backHref}>
            Back to Memory Frameworks
          </Link>
          {externalLinks.map((link) => (
            <ExternalLink key={link.label} href={link.href} className="link-action external-link-inline">
              {link.label}
            </ExternalLink>
          ))}
        </div>
      </header>

      {metaStrip}

      <div className="entity-tabs-or" role="tablist" aria-label="Memory framework sections" onKeyDown={onTabListKeyDown}>
        <button
          ref={(el) => {
            tabRefs.current[0] = el;
          }}
          type="button"
          role="tab"
          id="tab-overview"
          aria-selected={tab === "overview"}
          aria-controls="panel-overview"
          tabIndex={tab === "overview" ? 0 : -1}
          className={`entity-tab-or ${tab === "overview" ? "is-active" : ""}`}
          onClick={() => setTabAndUrl("overview")}
        >
          Overview
        </button>
        <button
          ref={(el) => {
            tabRefs.current[1] = el;
          }}
          type="button"
          role="tab"
          id="tab-data-flow"
          aria-selected={tab === "data-flow"}
          aria-controls="panel-data-flow"
          tabIndex={tab === "data-flow" ? 0 : -1}
          className={`entity-tab-or ${tab === "data-flow" ? "is-active" : ""}`}
          onClick={() => setTabAndUrl("data-flow")}
        >
          Data Flow
        </button>
        <button
          ref={(el) => {
            tabRefs.current[2] = el;
          }}
          type="button"
          role="tab"
          id="tab-qa"
          aria-selected={tab === "qa"}
          aria-controls="panel-qa"
          tabIndex={tab === "qa" ? 0 : -1}
          className={`entity-tab-or ${tab === "qa" ? "is-active" : ""}`}
          onClick={() => setTabAndUrl("qa")}
        >
          Q&A
        </button>
      </div>

      <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={tab !== "overview"} className="entity-tab-panel">
        {overviewPanel}
      </div>
      <div id="panel-data-flow" role="tabpanel" aria-labelledby="tab-data-flow" hidden={tab !== "data-flow"} className="entity-tab-panel">
        {dataFlowPanel}
      </div>
      <div id="panel-qa" role="tabpanel" aria-labelledby="tab-qa" hidden={tab !== "qa"} className="entity-tab-panel">
        {qaPanel}
      </div>
    </>
  );
}
