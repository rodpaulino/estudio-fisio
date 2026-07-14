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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

type Aggregate = { id: string; name: string; count: number; revenue: number };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  const today = new Date();
  const fromDate = params.from ? new Date(`${params.from}T00:00:00`) : startOfMonth(today);
  const toDate = params.to ? new Date(`${params.to}T23:59:59`) : today;

  const [sessions, allProfessors, allUnits] = await Promise.all([
    prisma.classSession.findMany({
      where: { scheduledAt: { gte: fromDate, lte: toDate } },
      include: { unit: true, professor: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "PROFESSOR", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  const completed = sessions.filter((session) => session.status === "COMPLETED");
  const canceled = sessions.filter((session) => session.status === "CANCELED");
  const scheduled = sessions.filter((session) => session.status === "SCHEDULED");

  function sessionValue(session: (typeof sessions)[number]) {
    return (session.pricePerHour ?? 0) * (session.durationMinutes / 60);
  }

  const totalRevenue = completed.reduce((sum, session) => sum + sessionValue(session), 0);

  const byProfessor = new Map<string, Aggregate>();

  for (const session of completed) {
    const value = sessionValue(session);

    const profEntry = byProfessor.get(session.professorId) ?? {
      id: session.professorId,
      name: session.professor.name,
      count: 0,
      revenue: 0,
    };
    profEntry.count += 1;
    profEntry.revenue += value;
    byProfessor.set(session.professorId, profEntry);
  }

  const professorRows = [...byProfessor.values()].sort((a, b) => b.revenue - a.revenue);

  const unitStatusRows = allUnits.map((unit) => {
    const unitSessions = sessions.filter((session) => session.unitId === unit.id);
    return {
      id: unit.id,
      name: unit.name,
      scheduled: unitSessions.filter((session) => session.status === "SCHEDULED").length,
      completed: unitSessions.filter((session) => session.status === "COMPLETED").length,
      canceled: unitSessions.filter((session) => session.status === "CANCELED").length,
    };
  });

  const unitRevenueRows = allUnits.map((unit) => ({
    id: unit.id,
    name: unit.name,
    revenue: completed
      .filter((session) => session.unitId === unit.id)
      .reduce((sum, session) => sum + sessionValue(session), 0),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-slate-500">
          Receita e aulas concluídas por período, professor e unidade.
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
      </form>

      <form
        method="GET"
        action="/admin/relatorios/pdf"
        className="flex flex-wrap items-end gap-4 rounded-lg border p-4"
      >
        <div className="space-y-2">
          <Label htmlFor="professorId">Exportar relatório de um professor</Label>
          <select
            id="professorId"
            name="professorId"
            required
            defaultValue=""
            className="h-8 w-64 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground"
          >
            <option value="" disabled>
              Selecione o professor
            </option>
            {allProfessors.map((professor) => (
              <option key={professor.id} value={professor.id}>
                {professor.name}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="from" value={toDateInputValue(fromDate)} />
        <input type="hidden" name="to" value={toDateInputValue(toDate)} />
        <Button type="submit" variant="outline">
          Exportar PDF
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Aulas agendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{scheduled.length}</p>
            <div className="space-y-1 border-t pt-2">
              {unitStatusRows.map((unit) => (
                <div key={unit.id} className="flex justify-between text-xs text-slate-500">
                  <span>{unit.name}</span>
                  <span className="font-medium text-slate-700">{unit.scheduled}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Aulas canceladas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{canceled.length}</p>
            <div className="space-y-1 border-t pt-2">
              {unitStatusRows.map((unit) => (
                <div key={unit.id} className="flex justify-between text-xs text-slate-500">
                  <span>{unit.name}</span>
                  <span className="font-medium text-slate-700">{unit.canceled}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Aulas concluídas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{completed.length}</p>
            <div className="space-y-1 border-t pt-2">
              {unitStatusRows.map((unit) => (
                <div key={unit.id} className="flex justify-between text-xs text-slate-500">
                  <span>{unit.name}</span>
                  <span className="font-medium text-slate-700">{unit.completed}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              Receita no período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{formatCurrency(totalRevenue)}</p>
            <div className="space-y-1 border-t pt-2">
              {unitRevenueRows.map((unit) => (
                <div key={unit.id} className="flex justify-between text-xs text-slate-500">
                  <span>{unit.name}</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(unit.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Receita por professor</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Professor</TableHead>
              <TableHead>Aulas concluídas</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {professorRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{formatCurrency(row.revenue)}</TableCell>
                <TableCell>
                  <a
                    href={`/admin/relatorios/pdf?professorId=${row.id}&from=${toDateInputValue(fromDate)}&to=${toDateInputValue(toDate)}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Exportar PDF
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {professorRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500">
                  Nenhuma aula concluída no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
