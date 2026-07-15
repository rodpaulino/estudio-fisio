"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { professorSchema, resetPasswordSchema } from "@/lib/validations";

export type ProfessorFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export type ResetPasswordFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createProfessor(
  _prevState: ProfessorFormState,
  formData: FormData
): Promise<ProfessorFormState> {
  await requireUser("ADMIN");

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
    return { fieldErrors: { password: ["Defina uma senha inicial."] } };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: ["Já existe um usuário com este email."] } };
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
    },
  });

  revalidatePath("/admin/professores");
  return undefined;
}

export async function updateProfessor(
  professorId: string,
  _prevState: ProfessorFormState,
  formData: FormData
): Promise<ProfessorFormState> {
  await requireUser("ADMIN");

  const parsed = professorSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    cref: formData.get("cref"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== professorId) {
    return { fieldErrors: { email: ["Já existe um usuário com este email."] } };
  }

  await prisma.user.update({
    where: { id: professorId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      email,
      cref: parsed.data.cref,
    },
  });

  revalidatePath("/admin/professores");
  return undefined;
}

export async function resetProfessorPassword(
  professorId: string,
  _prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  await requireUser("ADMIN");

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { id: professorId },
    data: { passwordHash },
  });

  revalidatePath("/admin/professores");
  return undefined;
}

export async function toggleProfessorActive(professorId: string, active: boolean) {
  await requireUser("ADMIN");
  await prisma.user.update({
    where: { id: professorId },
    data: { active, ...(active ? { pendingApproval: false } : {}) },
  });
  revalidatePath("/admin/professores");
  revalidatePath("/admin/aprovacoes");
  revalidatePath("/admin");
}
