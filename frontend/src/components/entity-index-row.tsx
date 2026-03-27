import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import type { Entity } from "@/lib/types";

type EntityIndexRowLinkProps = {
  entity: Entity;
  href: string;
  subtitle?: string;
  compact?: boolean;
};

function ownerLabel(entity: Entity) {
  const owner = entity.githubFullName.split("/")[0] ?? "";
  return owner ? `by ${owner}` : entity.githubFullName;
}

export function EntityIndexRowLink({ entity, href, subtitle, compact = false }: EntityIndexRowLinkProps) {
  return (
    <Link href={href} className={`entity-index-row entity-index-row--link ${compact ? "is-compact" : ""}`}>
      <div className="entity-index-row-main">
        <div className="entity-index-row-topline">
          <strong className="entity-index-primary">{entity.name}</strong>
          <span className="entity-index-mini-badge">{entity.language ?? "Unknown"}</span>
        </div>
        <span className="entity-index-meta">{subtitle ?? ownerLabel(entity)}</span>
        {!compact ? <p className="entity-index-description">{entity.description}</p> : null}
        {!compact ? (
          <div className="entity-index-tags" aria-hidden="true">
            {entity.tags.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="entity-index-row-stats" aria-hidden="true">
        <span className="entity-index-stat-value">{entity.stats.stars.toLocaleString()}</span>
        <span className="entity-index-meta">GitHub stars</span>
        {!compact ? <span className="entity-index-stat-secondary">{entity.githubFullName}</span> : null}
      </div>
    </Link>
  );
}

type EntityIndexListProps = {
  entities: Entity[];
  hrefFor: (entity: Entity) => string;
};

export function EntityIndexList({ entities, hrefFor }: EntityIndexListProps) {
  return (
    <div className="entity-index-list">
      {entities.map((entity) => (
        <EntityIndexRowLink key={entity.entityId} entity={entity} href={hrefFor(entity)} />
      ))}
    </div>
  );
}

type EntityTableCellsProps = {
  entity: Entity;
  detailHref: string;
};

export function EntityTableCells({ entity, detailHref }: EntityTableCellsProps) {
  return (
    <>
      <td>
        <div className="entity-table-cell-stack">
          <Link href={detailHref} className="entity-index-primary entity-table-cell-title">
            {entity.name}
          </Link>
          <span className="entity-index-meta entity-table-cell-description">{entity.description}</span>
        </div>
      </td>
      <td>
        <div className="entity-table-cell-stack">
          <ExternalLink href={entity.githubUrl} className="entity-index-meta entity-table-cell-repo">
            {entity.githubFullName}
          </ExternalLink>
          <span className="entity-index-meta entity-table-cell-description">{ownerLabel(entity)}</span>
        </div>
      </td>
      <td className="entity-index-meta">
        {entity.arxiv.url ? (
          <ExternalLink href={entity.arxiv.url}>{entity.arxiv.id ?? "Paper"}</ExternalLink>
        ) : (
          ""
        )}
      </td>
      <td className="entity-index-meta">
        {entity.homepageUrl ? <ExternalLink href={entity.homepageUrl}>Website</ExternalLink> : ""}
      </td>
    </>
  );
}
