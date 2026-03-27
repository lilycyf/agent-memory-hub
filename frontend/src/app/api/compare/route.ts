import { NextRequest, NextResponse } from "next/server";
import { getCompare } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.getAll("ids").slice(0, 3);
    const compare = await getCompare(ids);
    return NextResponse.json({ compare });
  } catch (error) {
    console.error("GET /api/compare failed", error);
    return NextResponse.json({ error: "Failed to build compare result" }, { status: 500 });
  }
}
