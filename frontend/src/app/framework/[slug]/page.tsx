import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EntityDetailShell, type BreadcrumbItem } from "@/components/entity-detail-shell";
import { comparePathFromIds } from "@/lib/entity-utils";
import { getEntity, getQa } from "@/lib/repository";

type EntityPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    query?: string;
    tag?: string | string[];
    ids?: string | string[];
  }>;
};

export async function generateMetadata({ params }: EntityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entityId = decodeURIComponent(slug);
  const entity = await getEntity(entityId);
  if (!entity) {
    return { title: "Not found · Memory Router" };
  }
  const title = `${entity.name} · Memory Router`;
  return {
    title,
    description: entity.description,
    openGraph: { title: entity.name, description: entity.description },
    twitter: { card: "summary_large_image", title: entity.name, description: entity.description },
    alternates: {
      canonical: `/framework/${encodeURIComponent(entity.entityId)}`,
    },
  };
}

export default async function FrameworkPage({ params, searchParams }: EntityPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const entityId = decodeURIComponent(slug);
  const entity = await getEntity(entityId);
  if (!entity) return notFound();
  const qa = await getQa(entityId);
  const qaSections = Array.from(
    qa.reduce((map, item) => {
      const group = map.get(item.section) ?? [];
      group.push(item);
      map.set(item.section, group);
      return map;
    }, new Map<string, typeof qa>()),
  );
  const answeredQaCount = qa.filter((item) => item.answer && item.answer !== "unknown").length;
  const compareIdsRaw = resolvedSearchParams.ids;
  const compareIds = Array.isArray(compareIdsRaw) ? compareIdsRaw : compareIdsRaw ? [compareIdsRaw] : [];
  const tagParam = resolvedSearchParams.tag;
  const selectedTags = Array.isArray(tagParam) ? tagParam : tagParam ? [tagParam] : [];

  const backParams = new URLSearchParams();
  if (resolvedSearchParams.query) backParams.set("query", resolvedSearchParams.query);
  selectedTags.forEach((tag) => backParams.append("tag", tag));
  compareIds.forEach((id) => backParams.append("ids", id));

  const releaseSignal = entity.repoUpdatedAt ? String(entity.repoUpdatedAt).slice(0, 10) : "unknown";
  const collectedOn = entity.sourceSnapshotAt ? String(entity.sourceSnapshotAt).slice(0, 10) : "--";
  const externalLinks = [
    { label: "GitHub", href: entity.githubUrl },
    entity.docsUrl ? { label: "Docs", href: entity.docsUrl } : null,
    entity.homepageUrl ? { label: "Homepage", href: entity.homepageUrl } : null,
    entity.arxiv.url ? { label: "Paper", href: entity.arxiv.url } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  const backHref = backParams.toString() ? `/framework?${backParams.toString()}` : "/framework";
  const breadcrumb: BreadcrumbItem[] = [
    { label: "Memory Frameworks", href: "/framework" },
    { label: entity.name },
  ];

  const metaStrip = (
    <section className="detail-meta-strip detail-meta-strip-grid">
      <article className="detail-meta-item detail-meta-card">
        <span>Stars</span>
        <strong>{entity.stats.stars.toLocaleString()}</strong>
      </article>
      <article className="detail-meta-item detail-meta-card">
        <span>Forks / Issues</span>
        <strong>
          {entity.stats.forks.toLocaleString()} / {entity.stats.openIssues.toLocaleString()}
        </strong>
      </article>
      <article className="detail-meta-item detail-meta-card">
        <span>GitHub last updated</span>
        <strong>{releaseSignal}</strong>
      </article>
      <article className="detail-meta-item detail-meta-card">
        <span>Q&amp;A coverage</span>
        <strong>
          {answeredQaCount} / {qa.length}
        </strong>
      </article>
    </section>
  );

  const overviewPanel = (
    <section className="detail-grid entity-tab-panel-inner detail-overview-grid">
      <article className="detail-card detail-section detail-card-emphasis">
        <div className="section-kicker">At a glance</div>
        <h2>Profile summary</h2>
        <div className="detail-definition-grid detail-definition-grid-wide">
          <div>
            <strong>Primary language</strong>
            <p>{entity.language ?? "Unknown"}</p>
          </div>
          <div>
            <strong>License</strong>
            <p>{entity.license ?? "Unknown"}</p>
          </div>
          <div>
            <strong>Tags</strong>
            <p>{entity.tags.join(", ") || "--"}</p>
          </div>
          <div>
            <strong>arXiv match</strong>
            <p>{entity.arxiv.matchType}</p>
          </div>
          <div>
            <strong>Repository</strong>
            <p>{entity.githubFullName}</p>
          </div>
          <div>
            <strong>GitHub last updated</strong>
            <p>{releaseSignal}</p>
          </div>
          <div>
            <strong>Data collected on</strong>
            <p>{collectedOn}</p>
          </div>
        </div>
      </article>

      <article className="detail-card detail-section">
        <div className="section-kicker">Taxonomy</div>
        <h2>Tags</h2>
        <p className="detail-copy">
          Standardized tags curated from the allowed taxonomy list.
        </p>
        <div className="chip-row">
          {entity.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </article>

      <article className="detail-card detail-section">
        <div className="section-kicker">Research and links</div>
        <h2>Reference material</h2>
        <div className="detail-note-list">
          <div>
            <strong>Paper</strong>
            <p>{entity.arxiv.title ?? "No linked paper title available."}</p>
          </div>
          <div>
            <strong>Linked sources</strong>
            <p>{externalLinks.map((link) => link.label).join(" · ")}</p>
          </div>
        </div>
      </article>
    </section>
  );

  const dataFlowPanel = (
    <section className="entity-tab-panel-inner detail-diagram-stack">
      <header className="detail-card detail-section detail-card-emphasis detail-diagram-intro">
        <div className="section-kicker">System pathways</div>
        <h2>Data Flow</h2>
        <p className="detail-copy">
          Flow definitions are read from the database and shown directly as structured text when available.
        </p>
      </header>

      <section className="detail-diagram-grid" aria-label="Memory framework data flows">
        {(entity.diagrams.length
          ? entity.diagrams
          : [
              {
                slug: "data-flow",
                title: "Data Flow",
                subtitle: "Flow 01",
                description: "No data flow has been stored for this memory framework yet.",
                type: "text" as const,
                text: "",
              },
            ]
        ).map((slot, index) => (
          <article className="detail-card detail-section detail-diagram-card" key={slot.title}>
            <div className="detail-diagram-head">
              <span className="badge">{slot.subtitle ?? `Flow ${String(index + 1).padStart(2, "0")}`}</span>
              <span className="subtle">{slot.text ? "Text loaded" : "Text missing"}</span>
            </div>
            <h3>{slot.title}</h3>
            <p className="detail-copy">{slot.description ?? "No description available."}</p>
            {slot.text ? (
              <pre className="detail-flow-surface">{slot.text}</pre>
            ) : (
              <div className="detail-diagram-placeholder" aria-hidden="true">
                <div className="detail-diagram-placeholder-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  );

  const qaPanel = (
    <section className="qa-section entity-tab-panel-inner qa-section-or">
      <header className="detail-card detail-section detail-card-emphasis detail-tab-intro">
        <div className="section-kicker">Structured Q&amp;A</div>
        <div className="detail-diagram-head">
          <h2>Q&amp;A</h2>
          <span className="subtle">{qaSections.length} section(s)</span>
        </div>
      </header>

      <div className="qa-section-groups">
        {qaSections.map(([sectionName, items]) => (
          <article className="qa-group" key={sectionName}>
            <div className="qa-group-head">
              <h3>{sectionName}</h3>
              <span className="badge">{items.length} item(s)</span>
            </div>
            <div className="qa-list">
              {items.map((item) => {
                const hasAnswer = Boolean(item.answer && item.answer !== "unknown");
                return (
                  <article className="qa-item" key={item.id}>
                    <div className="qa-item-head">
                      <span className="badge">Q{item.id}</span>
                      <span>Confidence {Math.round(item.confidence * 100)}%</span>
                      <span className={`qa-status-badge ${hasAnswer ? "is-answered" : ""}`}>
                        {hasAnswer ? "Answered" : "Unknown"}
                      </span>
                    </div>
                    <h4>{item.question}</h4>
                    <p>{hasAnswer ? item.answer : "No extracted answer yet."}</p>
                  </article>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <div className="page-shell narrow detail-page">
      <Suspense fallback={<p className="hint">Loading...</p>}>
        <EntityDetailShell
          breadcrumb={breadcrumb}
          entityIdLine={entity.entityId}
          title={entity.name}
          subtitle={entity.githubFullName}
          description={entity.description}
          tags={entity.tags.slice(0, 6)}
          compareHref={comparePathFromIds([entity.entityId])}
          backHref={backHref}
          externalLinks={externalLinks}
          summaryItems={[
            { label: "Stars", value: entity.stats.stars.toLocaleString() },
            { label: "Language", value: entity.language ?? "Unknown" },
            { label: "Paper", value: entity.arxiv.matchType },
            { label: "Coverage", value: `${answeredQaCount}/${qa.length}` },
          ]}
          metaStrip={metaStrip}
          overviewPanel={overviewPanel}
          dataFlowPanel={dataFlowPanel}
          qaPanel={qaPanel}
        />
      </Suspense>
    </div>
  );
}
