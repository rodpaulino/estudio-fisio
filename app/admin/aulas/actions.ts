"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { classSessionSchema } from "@/lib/validations";
import { priceForStudentCount } from "@/lib/pricing";

export type ClassSessionFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createClassSession(
  _prevState: ClassSessionFormState,
  formData: FormData
): Promise<ClassSessionFormState> {
  const user = await requireUser("ADMIN");

  const parsed = classSessionSchema.safeParse({
    unitId: formData.get("unitId"),
    professorId: formData.get("professorId"),
    scheduledAt: formData.get("scheduledAt"),
    studentIds: formData.getAll("studentIds"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { scheduledAt: ["Data e hora inválidas."] } };
  }

  const pricePerHour = priceForStudentCount(parsed.data.studentIds.length);

  await prisma.classSession.create({
    data: {
      unitId: parsed.data.unitId,
      professorId: parsed.data.professorId,
      scheduledAt,
      pricePerHour,
      createdById: user.id,
      attendances: {
        create: parsed.data.studentIds.map((studentId) => ({ studentId })),
      },
    },
  });

  revalidatePath("/admin/aulas");
  return undefined;
}

export async function updateClassSessionStatus(
  classSessionId: string,
  status: "COMPLETED" | "CANCELED"
) {
  await requireUser("ADMIN");

  if (status === "COMPLETED") {
    const session = await prisma.classSession.findUnique({
      where: { id: classSessionId },
    });
    if (!session || session.scheduledAt > new Date()) return;
  }

  await prisma.classSession.update({
    where: { id: classSessionId },
    data: { status },
  });
  revalidatePath("/admin/aulas");
}
