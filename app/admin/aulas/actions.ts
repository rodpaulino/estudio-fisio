"use server";

import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import {
  classSessionSchema,
  recurringClassSessionSchema,
} from "@/lib/validations";
import { priceForStudentCount } from "@/lib/pricing";

export type ClassSessionFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

const MAX_RECURRING_OCCURRENCES = 60;

function buildRecurringDates({
  startDate,
  endDate,
  time,
  weekdays,
}: {
  startDate: string;
  endDate: string;
  time: string;
  weekdays: string[];
}): Date[] {
  const selectedDays = new Set(weekdays.map(Number));
  const end = new Date(`${endDate}T00:00:00`);
  const dates: Date[] = [];

  for (
    let cursor = new Date(`${startDate}T00:00:00`);
    cursor <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    if (selectedDays.has(cursor.getDay())) {
      dates.push(new Date(`${format(cursor, "yyyy-MM-dd")}T${time}:00`));
    }
  }

  return dates;
}

export async function createClassSession(
  _prevState: ClassSessionFormState,
  formData: FormData
): Promise<ClassSessionFormState> {
  const user = await requireUser(["ADMIN", "PROFESSOR"]);

  if (formData.get("mode") === "recurring") {
    const parsed = recurringClassSessionSchema.safeParse({
      unitId: formData.get("unitId"),
      professorId: formData.get("professorId"),
      studentIds: formData.getAll("studentIds"),
      time: formData.get("time"),
      weekdays: formData.getAll("weekdays"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });
    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const professorId = user.role === "PROFESSOR" ? user.id : parsed.data.professorId;

    const dates = buildRecurringDates(parsed.data);
    if (dates.length === 0) {
      return {
        error: "Nenhuma data corresponde aos dias selecionados no período informado.",
      };
    }
    if (dates.length > MAX_RECURRING_OCCURRENCES) {
      return {
        error: `Período muito longo: seriam ${dates.length} aulas. Selecione um período com no máximo ${MAX_RECURRING_OCCURRENCES} aulas.`,
      };
    }

    const pricePerHour = priceForStudentCount(parsed.data.studentIds.length);

    await prisma.$transaction(
      dates.map((scheduledAt) =>
        prisma.classSession.create({
          data: {
            unitId: parsed.data.unitId,
            professorId,
            scheduledAt,
            pricePerHour,
            createdById: user.id,
            attendances: {
              create: parsed.data.studentIds.map((studentId) => ({ studentId })),
            },
          },
        })
      )
    );

    revalidatePath("/admin/aulas");
    revalidatePath("/professor");
    return undefined;
  }

  const parsed = classSessionSchema.safeParse({
    unitId: formData.get("unitId"),
    professorId: formData.get("professorId"),
    scheduledAt: formData.get("scheduledAt"),
    studentIds: formData.getAll("studentIds"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const professorId = user.role === "PROFESSOR" ? user.id : parsed.data.professorId;

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { fieldErrors: { scheduledAt: ["Data e hora inválidas."] } };
  }

  const pricePerHour = priceForStudentCount(parsed.data.studentIds.length);

  await prisma.classSession.create({
    data: {
      unitId: parsed.data.unitId,
      professorId,
      scheduledAt,
      pricePerHour,
      createdById: user.id,
      attendances: {
        create: parsed.data.studentIds.map((studentId) => ({ studentId })),
      },
    },
  });

  revalidatePath("/admin/aulas");
  revalidatePath("/professor");
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
