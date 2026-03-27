export function entityIdToSlug(entityId: string): string {
  return encodeURIComponent(entityId);
}

export function slugToEntityId(slug: string): string {
  return decodeURIComponent(slug);
}

export function comparePathFromIds(entityIds: string[]): string {
  const slugs = entityIds.slice(0, 3).map(entityIdToSlug);
  return slugs.length > 0 ? `/compare/${slugs.join("/")}` : "/compare";
}

export function compareSlugsToEntityIds(slugs: string[] | undefined): string[] {
  return (slugs ?? []).slice(0, 3).map(slugToEntityId);
}
