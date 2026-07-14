"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";

export async function approveChangeRequest(requestId: string) {
  const admin = await requireUser("ADMIN");

  const request = await prisma.scheduleChangeRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.status !== "PENDING") return;

  await prisma.$transaction([
    prisma.classSession.update({
      where: { id: request.classSessionId },
      data: {
        ...(request.type === "PROFESSOR_CHANGE" && request.proposedProfessorId
          ? { professorId: request.proposedProfessorId }
          : {}),
        ...(request.type === "TIME_CHANGE" && request.proposedScheduledAt
          ? { scheduledAt: request.proposedScheduledAt }
          : {}),
      },
    }),
    prisma.scheduleChangeRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    }),
  ]);

  revalidatePath("/admin/aprovacoes");
  revalidatePath("/admin/aulas");
}

export async function rejectChangeRequest(requestId: string) {
  const admin = await requireUser("ADMIN");

  const request = await prisma.scheduleChangeRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.status !== "PENDING") return;

  await prisma.scheduleChangeRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
  });

  revalidatePath("/admin/aprovacoes");
}
