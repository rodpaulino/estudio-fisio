import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RequestChangeDialog } from "@/components/forms/request-change-dialog";
import { ClassFormDialog } from "@/components/forms/class-form-dialog";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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

export default async function ProfessorHomePage() {
  const user = await requireUser("PROFESSOR");

  const [classes, otherProfessors, pendingRequests, units, students] = await Promise.all([
    prisma.classSession.findMany({
      where: { professorId: user.id },
      include: { unit: true, attendances: { include: { student: true } } },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "PROFESSOR", active: true, id: { not: user.id } },
      orderBy: { name: "asc" },
    }),
    prisma.scheduleChangeRequest.findMany({
      where: { requestedById: user.id, status: "PENDING" },
      select: { classSessionId: true },
    }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.student.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const pendingSet = new Set(pendingRequests.map((request) => request.classSessionId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Minhas aulas</h1>
        <ClassFormDialog units={units} students={students} fixedProfessorId={user.id} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Alunos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-64" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">
                {format(session.scheduledAt, "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>{session.unit.name}</TableCell>
              <TableCell>
                {session.attendances.map((a) => a.student.name).join(", ")}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[session.status]}>
                  {statusLabels[session.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {session.status === "SCHEDULED" && (
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/professor/aulas/${session.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Registrar presença
                    </Link>
                    <RequestChangeDialog
                      classSessionId={session.id}
                      professors={otherProfessors}
                      alreadyRequested={pendingSet.has(session.id)}
                    />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {classes.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500">
                Nenhuma aula atribuída.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
