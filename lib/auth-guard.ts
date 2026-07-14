import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(role?: "ADMIN" | "PROFESSOR") {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (role && session.user.role !== role) {
    redirect("/login");
  }

  return session.user;
}
