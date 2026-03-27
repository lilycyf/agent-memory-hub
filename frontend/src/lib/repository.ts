import "server-only";

import { entityMatchesFilters, type EntityListParams } from "@/lib/entity-list";
import { getPool } from "@/lib/server-db";
import { getUsedCategoryIds, normalizeSelectedTags, TAG_CATEGORY_DEFS, type TagCategoryId } from "@/lib/tag-taxonomy";
import type { Entity, EntityDiagram, EntityIndexStats, QaItem } from "@/lib/types";

type EntityRow = {
  entity_id: string;
  name: string;
  github_full_name: string;
  github_url: string;
  description: string | null;
  docs_url: string | null;
  homepage_url: string | null;
  tags: string[] | null;
  stargazers_count: number | null;
  forks_count: number | null;
  open_issues_count: number | null;
  repo_updated_at: string | Date | null;
  source_snapshot_at: string | Date | null;
  primary_language: string | null;
  license: string | null;
  arxiv_id: string | null;
  arxiv_url: string | null;
  arxiv_title: string | null;
  arxiv_match_type: "official" | "lineage" | "related" | "none" | null;
  arxiv_confidence: string | number | null;
  diagrams?: EntityDiagram[] | null;
};

type QaRow = {
  question_no: number;
  section: string;
  question: string;
  answer: string;
  confidence: string | number;
};

function mapEntity(row: EntityRow): Entity {
  const repoUpdatedAt =
    row.repo_updated_at instanceof Date
      ? row.repo_updated_at.toISOString()
      : row.repo_updated_at ?? undefined;
  const sourceSnapshotAt =
    row.source_snapshot_at instanceof Date
      ? row.source_snapshot_at.toISOString()
      : row.source_snapshot_at ?? undefined;

  return {
    entityId: row.entity_id,
    name: row.name,
    githubFullName: row.github_full_name,
    githubUrl: row.github_url,
    description: row.description ?? "",
    docsUrl: row.docs_url ?? undefined,
    homepageUrl: row.homepage_url ?? undefined,
    tags: row.tags ?? [],
    stats: {
      stars: row.stargazers_count ?? 0,
      forks: row.forks_count ?? 0,
      openIssues: row.open_issues_count ?? 0,
    },
    repoUpdatedAt,
    sourceSnapshotAt,
    language: row.primary_language ?? undefined,
    license: row.license ?? undefined,
    arxiv: {
      id: row.arxiv_id ?? undefined,
      url: row.arxiv_url ?? undefined,
      title: row.arxiv_title ?? undefined,
      matchType: row.arxiv_match_type ?? "none",
      confidence: Number(row.arxiv_confidence ?? 0),
    },
    diagrams: row.diagrams ?? [],
  };
}

function mapQa(row: QaRow): QaItem {
  return {
    id: row.question_no,
    section: row.section,
    question: row.question,
    answer: row.answer,
    confidence: Number(row.confidence ?? 0),
  };
}

export type ListEntitiesPage = {
  entities: Entity[];
  hasMore: boolean;
};

export type HomepageSummary = {
  entityCount: number;
  paperLinkedCount: number;
  languageCount: number;
  uniqueTagCount: number;
  questionsPerEntity: number;
  topTags: Array<{ tag: string; count: number }>;
  topCategories: Array<{ id: TagCategoryId; label: string; count: number }>;
};

const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 120;

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database is not configured. Set DATABASE_URL and retry.");
  }
  return pool;
}

function computeHomepageSummary(entities: Entity[], questionsPerEntity: number): HomepageSummary {
  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<TagCategoryId, number>();
  const languages = new Set(entities.map((entity) => entity.language).filter(Boolean));

  for (const entity of entities) {
    for (const tag of entity.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    for (const categoryId of getUsedCategoryIds(entity.tags)) {
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  const topCategories = TAG_CATEGORY_DEFS.map((category) => ({
    id: category.id,
    label: category.label,
    count: categoryCounts.get(category.id) ?? 0,
  }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 4);

  return {
    entityCount: entities.length,
    paperLinkedCount: entities.filter((entity) => entity.arxiv.url).length,
    languageCount: languages.size,
    uniqueTagCount: tagCounts.size,
    questionsPerEntity,
    topTags,
    topCategories,
  };
}

function clampPageParams(params: EntityListParams): {
  query: string;
  tags: string[];
  limit: number;
  offset: number;
} {
  const rawLimit = params.limit ?? DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const rawOff = params.offset ?? 0;
  const offset = Math.max(Number.isFinite(rawOff) ? rawOff : 0, 0);
  return {
    query: params.query ?? "",
    tags: normalizeSelectedTags(params.tags ?? []),
    limit,
    offset,
  };
}

export async function listEntityFacets(): Promise<{ tags: string[] }> {
  const pool = requirePool();
  const tagRows = await pool.query<{ value: string }>(
    `
    select distinct tf.key as value
    from public.entities,
    lateral jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
    where tf.value = 'true'
    order by 1
    `,
  );
  return {
    tags: tagRows.rows.map((r) => r.value).filter(Boolean),
  };
}

export async function getHomepageSummary(): Promise<HomepageSummary> {
  const pool = requirePool();
  const [entityResult, qaResult] = await Promise.all([
    pool.query<EntityRow>(
      `
      select
        entity_id, name, github_full_name, github_url, description, docs_url, homepage_url,
        coalesce((
          select array_agg(tf.key order by tf.key)
          from jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
          where tf.value = 'true'
        ), '{}'::text[]) as tags,
        stargazers_count, forks_count, open_issues_count, repo_updated_at, source_snapshot_at,
        primary_language, license,
        arxiv_id, arxiv_url, arxiv_title, arxiv_match_type, arxiv_confidence
      from public.entities
      `,
    ),
    pool.query<{ questions_per_entity: string }>(
      `
      select
        coalesce(max(question_count), 0)::text as questions_per_entity
      from (
        select entity_id, count(*) as question_count
        from public.qa_items
        group by entity_id
      ) grouped_counts
      `,
    ),
  ]);

  const qaStats = qaResult.rows[0];
  return computeHomepageSummary(entityResult.rows.map(mapEntity), Number(qaStats?.questions_per_entity ?? 0));
}

export async function getEntityIndexStats(
  query: string,
  tags: string[],
): Promise<EntityIndexStats> {
  const selectedTags = normalizeSelectedTags(tags);
  const pool = requirePool();

  const like = `%${query.trim().toLowerCase()}%`;
  const { rows } = await pool.query<EntityRow>(
    `
    select
      entity_id, name, github_full_name, github_url, description, docs_url, homepage_url,
      coalesce((
        select array_agg(tf.key order by tf.key)
        from jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
        where tf.value = 'true'
      ), '{}'::text[]) as tags,
      stargazers_count, forks_count, open_issues_count, repo_updated_at, source_snapshot_at,
      primary_language, license,
      arxiv_id, arxiv_url, arxiv_title, arxiv_match_type, arxiv_confidence
    from public.entities
    where
      ($1 = '' or lower(github_full_name) like $2 or lower(name) like $2
      or exists (
        select 1
        from jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
        where tf.value = 'true' and lower(tf.key) like $2
      ))
    `,
    [query.trim().toLowerCase(), like],
  );
  const filtered = rows.map(mapEntity).filter((entity) => entityMatchesFilters(entity, query, selectedTags));
  const langs = new Set(filtered.map((e) => e.language).filter(Boolean));
  return {
    total: filtered.length,
    paperCount: filtered.filter((e) => e.arxiv.url).length,
    languageCount: langs.size,
  };
}

export async function listEntitiesPaged(params: EntityListParams = {}): Promise<ListEntitiesPage> {
  const { query, tags, limit, offset } = clampPageParams(params);
  const fetchLimit = limit + 1;
  const pool = requirePool();

  const like = `%${query.trim().toLowerCase()}%`;
  const { rows } = await pool.query<EntityRow>(
    `
    select
      entity_id, name, github_full_name, github_url, description, docs_url, homepage_url,
      coalesce((
        select array_agg(tf.key order by tf.key)
        from jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
        where tf.value = 'true'
      ), '{}'::text[]) as tags,
      stargazers_count, forks_count, open_issues_count, repo_updated_at, source_snapshot_at,
      primary_language, license,
      arxiv_id, arxiv_url, arxiv_title, arxiv_match_type, arxiv_confidence
    from public.entities
    where
      ($1 = '' or lower(github_full_name) like $2 or lower(name) like $2
      or exists (
        select 1
        from jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
        where tf.value = 'true' and lower(tf.key) like $2
      ))
    order by stargazers_count desc nulls last, updated_at desc
    limit $3
    `,
    [query.trim().toLowerCase(), like, fetchLimit + offset],
  );
  const filtered = rows.map(mapEntity).filter((entity) => entityMatchesFilters(entity, query, tags));
  const slice = filtered.slice(offset, offset + fetchLimit);
  const hasMore = slice.length > limit;
  return { entities: slice.slice(0, limit), hasMore };
}


export async function getEntity(entityId: string): Promise<Entity | null> {
  const pool = requirePool();
  const { rows } = await pool.query<EntityRow>(
    `
    select
      entity_id, name, github_full_name, github_url, description, docs_url, homepage_url,
      coalesce((
        select array_agg(tf.key order by tf.key)
        from jsonb_each_text(coalesce(tag_flags, '{}'::jsonb)) as tf(key, value)
        where tf.value = 'true'
      ), '{}'::text[]) as tags,
      stargazers_count, forks_count, open_issues_count, repo_updated_at, source_snapshot_at,
      primary_language, license,
      arxiv_id, arxiv_url, arxiv_title, arxiv_match_type, arxiv_confidence,
      diagrams
    from public.entities
    where entity_id = $1
    limit 1
    `,
    [entityId],
  );
  if (!rows[0]) return null;
  return mapEntity(rows[0]);
}

export async function getQa(entityId: string): Promise<QaItem[]> {
  const pool = requirePool();
  const { rows } = await pool.query<QaRow>(
    `
    select question_no, section, question, answer, confidence
    from public.qa_items
    where entity_id = $1
    order by question_no asc
    `,
    [entityId],
  );
  return rows.map(mapQa);
}

export async function getCompare(ids: string[]) {
  const selected = ids.slice(0, 3);
  const result = await Promise.all(
    selected.map(async (entityId) => {
      const entity = await getEntity(entityId);
      if (!entity) return null;
      const qa = await getQa(entityId);
      return { entity, qa };
    }),
  );
  return result.filter(Boolean) as { entity: Entity; qa: QaItem[] }[];
}
