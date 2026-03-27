export function entityIdToSlug(entityId: string): string {
  return encodeURIComponent(entityId);
}

export function slugToEntityId(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function comparePathFromIds(entityIds: string[]): string {
  const params = new URLSearchParams();
  entityIds
    .slice(0, 3)
    .map(slugToEntityId)
    .filter(Boolean)
    .forEach((id) => params.append("ids", id));
  const qs = params.toString();
  return qs ? `/compare?${qs}` : "/compare";
}

export function compareQueryIdsToEntityIds(ids: string[]): string[] {
  return ids.map(slugToEntityId).filter(Boolean).slice(0, 3);
}
