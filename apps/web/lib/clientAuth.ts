import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export type ClientPortalPayload = {
  clientId: string;
  slug: string;
  name: string;
  type: "client_portal";
};

export async function getClientSession(): Promise<ClientPortalPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("client_token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if ((payload as { type?: string }).type !== "client_portal") return null;
    return payload as unknown as ClientPortalPayload;
  } catch {
    return null;
  }
}
