export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getMarketplaceCatalog, listToMarketplace } from "@/lib/marketplace/catalog";
import { cloneApp } from "@/lib/marketplace/clone";
import { marketplaceListingSchema } from "@/lib/validators";
import { structuredError } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const featured = searchParams.get("featured") === "true" ? true : undefined;

  const catalog = await getMarketplaceCatalog({ category, featured });
  return NextResponse.json({ listings: catalog, total: catalog.length });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "clone") {
    if (!body.sourceAppId || !body.newName) {
      return NextResponse.json(
        structuredError(400, "sourceAppId and newName are required for cloning"),
        { status: 400 }
      );
    }
    const result = await cloneApp(body.sourceAppId, body.newName);
    return NextResponse.json({ clone: result }, { status: 201 });
  }

  const parsed = marketplaceListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      structuredError(400, "Validation failed", parsed.error.errors),
      { status: 400 }
    );
  }

  const listing = await listToMarketplace(parsed.data);
  return NextResponse.json({ listing }, { status: 201 });
}
