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
import { Button } from "@/components/ui/button";
import { ClassFormDialog } from "@/components/forms/class-form-dialog";
import { prisma } from "@/lib/prisma";
import { updateClassSessionStatus } from "./actions";

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

export default async function AulasPage() {
  const [classes, units, professors, students] = await Promise.all([
    prisma.classSession.findMany({
      include: {
        unit: true,
        professor: true,
        attendances: { include: { student: true } },
      },
      orderBy: { scheduledAt: "desc" },
    }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "PROFESSOR", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aulas</h1>
        <ClassFormDialog units={units} professors={professors} students={students} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Alunos</TableHead>
            <TableHead>Preço/hora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-48" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">
                {format(session.scheduledAt, "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>{session.unit.name}</TableCell>
              <TableCell>{session.professor.name}</TableCell>
              <TableCell>
                {session.attendances.map((a) => a.student.name).join(", ")}
              </TableCell>
              <TableCell>
                {session.pricePerHour != null
                  ? session.pricePerHour.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[session.status]}>
                  {statusLabels[session.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {session.status === "SCHEDULED" && (
                  <div className="flex justify-end gap-2">
                    {session.scheduledAt <= new Date() && (
                      <form
                        action={updateClassSessionStatus.bind(null, session.id, "COMPLETED")}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          Concluir
                        </Button>
                      </form>
                    )}
                    <form
                      action={updateClassSessionStatus.bind(null, session.id, "CANCELED")}
                    >
                      <Button type="submit" variant="destructive" size="sm">
                        Cancelar
                      </Button>
                    </form>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {classes.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500">
                Nenhuma aula agendada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
