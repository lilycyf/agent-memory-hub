import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import type { Entity } from "@/lib/types";
import { entityIdToSlug } from "@/lib/entity-utils";

type EntityCardProps = {
  entity: Entity;
  href: string;
};

export function EntityCard({ entity, href }: EntityCardProps) {
  const updatedAt = entity.repoUpdatedAt ? String(entity.repoUpdatedAt).slice(0, 10) : "Unknown";
  const detailHref = href || `/framework/${entityIdToSlug(entity.entityId)}`;

  return (
    <article className="entity-card">
      <div className="entity-card-head">
        <div>
          <div className="entity-card-kicker">Framework</div>
          <h3>{entity.name}</h3>
          <ExternalLink href={entity.githubUrl} className="entity-repo-link">
            {entity.githubFullName}
          </ExternalLink>
          <p className="entity-card-description">{entity.description}</p>
        </div>
        <div className="entity-card-stats">
          <div>
            <span>Stars</span>
            <strong>{entity.stats.stars.toLocaleString()}</strong>
          </div>
          <div>
            <span>Forks</span>
            <strong>{entity.stats.forks.toLocaleString()}</strong>
          </div>
          <div>
            <span>Issues</span>
            <strong>{entity.stats.openIssues.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div className="entity-card-grid">
        <div className="entity-card-section">
          <span className="entity-card-label">Tags</span>
          <div className="entity-card-metadata">
            {entity.tags.slice(0, 6).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div className="entity-card-section">
          <span className="entity-card-label">Signals</span>
          <div className="entity-card-metadata">
            <span>{entity.language ?? "Unknown language"}</span>
            <span>{entity.license ?? "No license"}</span>
            <span>GitHub updated {updatedAt}</span>
            <span>arXiv {entity.arxiv.matchType}</span>
          </div>
        </div>
      </div>

      <div className="entity-card-actions">
        <Link className="entity-card-link" href={detailHref}>
          View Framework
        </Link>
        <ExternalLink href={entity.githubUrl} className="entity-card-link">
          Open GitHub
        </ExternalLink>
      </div>
    </article>
  );
}
