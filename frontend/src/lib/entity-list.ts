import type { Entity } from "@/lib/types";
import { groupSelectedTagsByCategory } from "@/lib/tag-taxonomy";

export type EntityListParams = {
  query?: string;
  limit?: number;
  offset?: number;
  tags?: string[];
};

export function entityMatchesFilters(
  entity: Entity,
  query: string,
  selectedTags: string[],
): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const inText =
      entity.githubFullName.toLowerCase().includes(q) ||
      entity.name.toLowerCase().includes(q) ||
      entity.tags.some((tag) => tag.toLowerCase().includes(q));
    if (!inText) return false;
  }
  const groupedTags = groupSelectedTagsByCategory(selectedTags);
  for (const tags of groupedTags.values()) {
    if (!tags.every((tag) => entity.tags.includes(tag))) return false;
  }
  return true;
}

export function collectEntityFacets(entities: Entity[]): { tags: string[] } {
  const tags = new Set<string>();
  for (const entity of entities) {
    entity.tags.forEach((tag) => tags.add(tag));
  }
  return {
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  };
}
