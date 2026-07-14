import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { format, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ProfessorReportDocument } from "@/lib/pdf/professor-report";

export async function GET(request: NextRequest) {
  const user = await requireUser("PROFESSOR");

  const { searchParams } = new URL(request.url);
  const today = new Date();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = fromParam ? new Date(`${fromParam}T00:00:00`) : startOfMonth(today);
  const toDate = toParam ? new Date(`${toParam}T23:59:59`) : today;

  const sessions = await prisma.classSession.findMany({
    where: {
      professorId: user.id,
      scheduledAt: { gte: fromDate, lte: toDate },
      status: { not: "SCHEDULED" },
    },
    include: { unit: true, attendances: { include: { student: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  const buffer = await renderToBuffer(
    <ProfessorReportDocument
      professorName={user.name ?? ""}
      fromLabel={format(fromDate, "dd/MM/yyyy")}
      toLabel={format(toDate, "dd/MM/yyyy")}
      sessions={sessions.map((session) => ({
        scheduledAt: session.scheduledAt,
        unitName: session.unit.name,
        studentNames: session.attendances.map((attendance) => attendance.student.name),
        status: session.status as "COMPLETED" | "CANCELED",
        durationMinutes: session.durationMinutes,
      }))}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="meu-relatorio.pdf"',
    },
  });
}
