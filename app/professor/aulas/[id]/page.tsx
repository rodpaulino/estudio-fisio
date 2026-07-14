import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceRow } from "@/components/forms/attendance-row";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { completeClassSession } from "./actions";

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  SCHEDULED: "default",
  COMPLETED: "secondary",
  CANCELED: "destructive",
};

export default async function ProfessorClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("PROFESSOR");

  const session = await prisma.classSession.findUnique({
    where: { id },
    include: {
      unit: true,
      attendances: {
        include: { student: true },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!session || session.professorId !== user.id) {
    notFound();
  }

  const disabled = session.status !== "SCHEDULED";
  const isTimeReached = session.scheduledAt <= new Date();
  const allSigned = session.attendances.every(
    (attendance) => !attendance.present || attendance.signatureDataUrl
  );
  const canComplete = isTimeReached && allSigned;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {session.unit.name} · {format(session.scheduledAt, "dd/MM/yyyy HH:mm")}
        </h1>
        <Badge variant={statusVariants[session.status]} className="mt-2">
          {statusLabels[session.status]}
        </Badge>
      </div>

      <div className="space-y-2">
        {session.attendances.map((attendance) => (
          <AttendanceRow
            key={attendance.studentId}
            classSessionId={session.id}
            attendance={{
              studentId: attendance.studentId,
              studentName: attendance.student.name,
              present: attendance.present,
              signedByName: attendance.signedByName,
            }}
            disabled={disabled}
          />
        ))}
        {session.attendances.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum aluno matriculado nesta aula.</p>
        )}
      </div>

      {!disabled && (
        <form action={completeClassSession.bind(null, session.id)} className="space-y-2">
          <Button type="submit" disabled={!canComplete}>
            Concluir aula
          </Button>
          {!isTimeReached && (
            <p className="text-sm text-slate-500">
              Esta aula só pode ser concluída a partir de{" "}
              {format(session.scheduledAt, "dd/MM/yyyy 'às' HH:mm")}.
            </p>
          )}
          {isTimeReached && !allSigned && (
            <p className="text-sm text-slate-500">
              Colete a assinatura de todos os alunos presentes para concluir.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
