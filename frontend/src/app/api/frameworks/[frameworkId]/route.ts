import { NextRequest, NextResponse } from "next/server";
import { getEntity, getQa } from "@/lib/repository";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ frameworkId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { frameworkId: encodedFrameworkId } = await params;
    const frameworkId = decodeURIComponent(encodedFrameworkId);
    const framework = await getEntity(frameworkId);
    if (!framework) {
      return NextResponse.json({ error: "Framework not found" }, { status: 404 });
    }
    const qa = await getQa(frameworkId);
    return NextResponse.json({ framework, qa });
  } catch (error) {
    console.error("GET /api/frameworks/[frameworkId] failed", error);
    return NextResponse.json({ error: "Failed to fetch framework detail" }, { status: 500 });
  }
}
