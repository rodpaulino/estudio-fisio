import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(
  role?: "ADMIN" | "PROFESSOR" | ("ADMIN" | "PROFESSOR")[]
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = Array.isArray(role) ? role : role ? [role] : null;
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/login");
  }

  return session.user;
}
