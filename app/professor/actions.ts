"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { changeRequestSchema } from "@/lib/validations";

export type ChangeRequestFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function requestScheduleChange(
  _prevState: ChangeRequestFormState,
  formData: FormData
): Promise<ChangeRequestFormState> {
  const user = await requireUser("PROFESSOR");

  const parsed = changeRequestSchema.safeParse({
    classSessionId: formData.get("classSessionId"),
    type: formData.get("type"),
    proposedProfessorId: formData.get("proposedProfessorId") || undefined,
    proposedScheduledAt: formData.get("proposedScheduledAt") || undefined,
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await prisma.classSession.findUnique({
    where: { id: parsed.data.classSessionId },
  });
  if (!session || session.professorId !== user.id) {
    return { error: "Aula não encontrada." };
  }
  if (session.status !== "SCHEDULED") {
    return { error: "Só é possível solicitar troca para aulas agendadas." };
  }

  const existingPending = await prisma.scheduleChangeRequest.findFirst({
    where: { classSessionId: parsed.data.classSessionId, status: "PENDING" },
  });
  if (existingPending) {
    return { error: "Já existe uma solicitação pendente para esta aula." };
  }

  await prisma.scheduleChangeRequest.create({
    data: {
      classSessionId: parsed.data.classSessionId,
      requestedById: user.id,
      type: parsed.data.type,
      reason: parsed.data.reason,
      proposedProfessorId:
        parsed.data.type === "PROFESSOR_CHANGE" && parsed.data.proposedProfessorId
          ? parsed.data.proposedProfessorId
          : null,
      proposedScheduledAt:
        parsed.data.type === "TIME_CHANGE" && parsed.data.proposedScheduledAt
          ? new Date(parsed.data.proposedScheduledAt)
          : null,
    },
  });

  revalidatePath("/professor");
  return undefined;
}
