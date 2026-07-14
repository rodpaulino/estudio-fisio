"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { studentSchema } from "@/lib/validations";

export type StudentFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseStudent(formData: FormData) {
  return studentSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    trainingLevel: formData.get("trainingLevel"),
    unitId: formData.get("unitId"),
    guardianName: formData.get("guardianName"),
    guardianRelationship: formData.get("guardianRelationship"),
    guardianAddress: formData.get("guardianAddress"),
    guardianPhone: formData.get("guardianPhone"),
  });
}

export async function createStudent(
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const user = await requireUser("ADMIN");

  const parsed = parseStudent(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.student.findUnique({
    where: { cpf: parsed.data.cpf },
  });
  if (existing) {
    return { fieldErrors: { cpf: ["Já existe um aluno com este CPF."] } };
  }

  await prisma.student.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      cpf: parsed.data.cpf,
      email: parsed.data.email || null,
      trainingLevel: parsed.data.trainingLevel,
      unitId: parsed.data.unitId,
      guardianName: parsed.data.guardianName || null,
      guardianRelationship: parsed.data.guardianRelationship || null,
      guardianAddress: parsed.data.guardianAddress || null,
      guardianPhone: parsed.data.guardianPhone || null,
      registeredById: user.id,
    },
  });

  revalidatePath("/admin/alunos");
  return undefined;
}

export async function updateStudent(
  studentId: string,
  _prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  await requireUser("ADMIN");

  const parsed = parseStudent(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.student.findUnique({
    where: { cpf: parsed.data.cpf },
  });
  if (existing && existing.id !== studentId) {
    return { fieldErrors: { cpf: ["Já existe um aluno com este CPF."] } };
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      phone: parsed.data.phone,
      cpf: parsed.data.cpf,
      email: parsed.data.email || null,
      trainingLevel: parsed.data.trainingLevel,
      unitId: parsed.data.unitId,
      guardianName: parsed.data.guardianName || null,
      guardianRelationship: parsed.data.guardianRelationship || null,
      guardianAddress: parsed.data.guardianAddress || null,
      guardianPhone: parsed.data.guardianPhone || null,
    },
  });

  revalidatePath("/admin/alunos");
  return undefined;
}

export async function toggleStudentActive(studentId: string, active: boolean) {
  await requireUser("ADMIN");
  await prisma.student.update({
    where: { id: studentId },
    data: { active },
  });
  revalidatePath("/admin/alunos");
}
