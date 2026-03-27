import { NextRequest, NextResponse } from "next/server";
import { getEntityIndexStats, listEntitiesPaged } from "@/lib/repository";

export const runtime = "nodejs";

const MAX_LIMIT = 120;

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = sp.get("query") ?? "";
    const rawLimit = Number(sp.get("limit") ?? 40);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT) : 40;
    const rawOffset = Number(sp.get("offset") ?? 0);
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
    const tags = sp.getAll("tag");
    const includeStats = sp.get("stats") === "1";

    const page = await listEntitiesPaged({ query, limit, offset, tags });
    const stats = includeStats ? await getEntityIndexStats(query, tags) : undefined;

    return NextResponse.json({
      frameworks: page.entities,
      hasMore: page.hasMore,
      ...(stats ? { stats } : {}),
    });
  } catch (error) {
    console.error("GET /api/frameworks failed", error);
    return NextResponse.json({ error: "Failed to fetch frameworks" }, { status: 500 });
  }
}
