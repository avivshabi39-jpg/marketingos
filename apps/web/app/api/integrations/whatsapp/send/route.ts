import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/whatsapp";

const schema = z.object({
  to: z.string().min(1),
  message: z.string().min(1).max(4096),
  instanceId: z.string().min(1),
  apiToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { to, message, instanceId, apiToken } = parsed.data;
  const result = await sendWhatsApp(to, message, instanceId, apiToken);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
