"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";

async function assertOwnsSession(classSessionId: string, professorId: string) {
  const session = await prisma.classSession.findUnique({
    where: { id: classSessionId },
  });
  if (!session || session.professorId !== professorId) {
    throw new Error("Aula não encontrada.");
  }
  return session;
}

export async function setAttendancePresence(
  classSessionId: string,
  studentId: string,
  present: boolean
) {
  const user = await requireUser("PROFESSOR");
  await assertOwnsSession(classSessionId, user.id);

  await prisma.attendance.update({
    where: { classSessionId_studentId: { classSessionId, studentId } },
    data: present
      ? { present: true }
      : { present: false, signatureDataUrl: null, signedByName: null, signedAt: null },
  });

  revalidatePath(`/professor/aulas/${classSessionId}`);
}

export async function signAttendance(
  classSessionId: string,
  studentId: string,
  signedByName: string,
  signatureDataUrl: string
) {
  const user = await requireUser("PROFESSOR");
  await assertOwnsSession(classSessionId, user.id);

  await prisma.attendance.update({
    where: { classSessionId_studentId: { classSessionId, studentId } },
    data: { present: true, signedByName, signatureDataUrl, signedAt: new Date() },
  });

  revalidatePath(`/professor/aulas/${classSessionId}`);
}

export async function completeClassSession(classSessionId: string) {
  const user = await requireUser("PROFESSOR");
  const session = await assertOwnsSession(classSessionId, user.id);

  if (session.scheduledAt > new Date()) return;

  const attendances = await prisma.attendance.findMany({
    where: { classSessionId },
  });
  const canComplete = attendances.every((a) => !a.present || a.signatureDataUrl);
  if (!canComplete) return;

  await prisma.classSession.update({
    where: { id: classSessionId },
    data: { status: "COMPLETED" },
  });

  revalidatePath(`/professor/aulas/${classSessionId}`);
  revalidatePath("/professor");
}
