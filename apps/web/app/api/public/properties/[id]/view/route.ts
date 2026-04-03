import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/public/properties/[id]/view — NO auth required.
// Increments `views` by 1 on the property with the given id.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  } catch (err: unknown) {
    // Prisma throws P2025 when the record is not found
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    console.error("[view] unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
