import { verifyToken } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function validateSession() {
  const sessionCookie = (await cookies()).get("session");
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  let sessionData;
  try {
    sessionData = await verifyToken(sessionCookie.value);
  } catch {
    return null;
  }
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== "number"
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  return sessionData;
}

export default validateSession;
