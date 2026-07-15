"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { professorSchema } from "@/lib/validations";

export type SignupFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean }
  | undefined;

export async function requestSignup(
  _prevState: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const parsed = professorSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    cref: formData.get("cref"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!parsed.data.password) {
    return { fieldErrors: { password: ["Defina uma senha."] } };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: ["Já existe uma conta com este email."] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      email,
      cref: parsed.data.cref,
      passwordHash,
      role: "PROFESSOR",
      active: false,
      pendingApproval: true,
    },
  });

  return { success: true };
}
