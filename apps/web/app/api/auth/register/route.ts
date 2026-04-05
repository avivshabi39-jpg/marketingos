import { NextResponse } from "next/server";

// Registration is CLOSED — admin only
// Only system admin can create accounts via /api/admin/create-user
export async function POST() {
  return NextResponse.json(
    {
      error: "ההרשמה סגורה",
      message: "צור קשר עם המנהל לקבלת גישה",
    },
    { status: 403 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "ההרשמה סגורה" }, { status: 403 });
}
