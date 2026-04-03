import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/clientAuth";

// POST /api/client-upload — upload image to Cloudinary
// Requires client portal session. Returns { url }
export async function POST(req: NextRequest) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary is not configured, return an error with guidance
  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: "Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in .env.local" },
      { status: 503 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate type & size
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: jpeg, png, webp, gif" },
      { status: 400 }
    );
  }
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const buf = await file.arrayBuffer();
  if (buf.byteLength > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  // Upload via Cloudinary unsigned upload preset
  const cloudForm = new FormData();
  cloudForm.append("file", new Blob([buf], { type: file.type }), file.name);
  cloudForm.append("upload_preset", uploadPreset);
  cloudForm.append("folder", "marketingos/logos");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: cloudForm }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { error?: { message?: string } }).error?.message ?? "Upload failed" },
      { status: 502 }
    );
  }

  const data = await res.json() as { secure_url: string };
  return NextResponse.json({ url: data.secure_url });
}
