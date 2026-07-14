import { format, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

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

export default async function ProfessorHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireUser("PROFESSOR");
  const params = await searchParams;

  const today = new Date();
  const fromDate = params.from ? new Date(`${params.from}T00:00:00`) : startOfMonth(today);
  const toDate = params.to ? new Date(`${params.to}T23:59:59`) : today;

  const sessions = await prisma.classSession.findMany({
    where: {
      professorId: user.id,
      scheduledAt: { gte: fromDate, lte: toDate },
      status: { not: "SCHEDULED" },
    },
    include: { unit: true, attendances: { include: { student: true } } },
    orderBy: { scheduledAt: "desc" },
  });

  const completed = sessions.filter((session) => session.status === "COMPLETED");
  const canceled = sessions.filter((session) => session.status === "CANCELED");

  function sessionValue(session: (typeof sessions)[number]) {
    return (session.pricePerHour ?? 0) * (session.durationMinutes / 60);
  }

  const totalHours = completed.reduce(
    (sum, session) => sum + session.durationMinutes / 60,
    0
  );
  const totalValue = completed.reduce((sum, session) => sum + sessionValue(session), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Meu histórico</h1>
        <p className="text-sm text-slate-500">
          Suas aulas concluídas e canceladas por período.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">De</Label>
          <Input id="from" name="from" type="date" defaultValue={toDateInputValue(fromDate)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Até</Label>
          <Input id="to" name="to" type="date" defaultValue={toDateInputValue(toDate)} />
        </div>
        <Button type="submit">Filtrar</Button>
        <a
          href={`/professor/historico/pdf?from=${toDateInputValue(fromDate)}&to=${toDateInputValue(toDate)}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Exportar PDF
        </a>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Aulas concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Aulas canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{canceled.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Horas trabalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {totalHours.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Valor das aulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Alunos</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium">
                {format(session.scheduledAt, "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>{session.unit.name}</TableCell>
              <TableCell>
                {session.attendances.map((a) => a.student.name).join(", ")}
              </TableCell>
              <TableCell>
                {session.pricePerHour != null ? formatCurrency(sessionValue(session)) : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[session.status]}>
                  {statusLabels[session.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500">
                Nenhuma aula concluída ou cancelada no período.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
