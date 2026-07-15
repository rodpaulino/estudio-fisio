import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [
    unitCount,
    professorCount,
    studentCount,
    pendingChangeRequests,
    pendingSignups,
    units,
    todaysClasses,
  ] = await Promise.all([
    prisma.unit.count(),
    prisma.user.count({ where: { role: "PROFESSOR", active: true } }),
    prisma.student.count({ where: { active: true } }),
    prisma.scheduleChangeRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "PROFESSOR", pendingApproval: true } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.classSession.findMany({
      where: {
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELED" },
      },
      include: { professor: true },
    }),
  ]);

  const stats = [
    { label: "Unidades", value: unitCount, href: "/admin/unidades" },
    { label: "Professores ativos", value: professorCount, href: "/admin/professores" },
    { label: "Alunos ativos", value: studentCount, href: "/admin/alunos" },
    {
      label: "Aprovações pendentes",
      value: pendingChangeRequests + pendingSignups,
      href: "/admin/aprovacoes",
    },
  ];

  const classCountsByUnit = new Map<string, Map<string, number>>();
  for (const session of todaysClasses) {
    const byProfessor = classCountsByUnit.get(session.unitId) ?? new Map<string, number>();
    byProfessor.set(session.professor.name, (byProfessor.get(session.professor.name) ?? 0) + 1);
    classCountsByUnit.set(session.unitId, byProfessor);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Aulas de hoje por unidade</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {units.map((unit) => {
            const byProfessor = classCountsByUnit.get(unit.id);
            const total = byProfessor
              ? Array.from(byProfessor.values()).reduce((sum, n) => sum + n, 0)
              : 0;

            return (
              <Link key={unit.id} href="/admin/aulas">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-500">
                      {unit.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-3xl font-semibold">{total}</p>
                    {byProfessor && byProfessor.size > 0 ? (
                      <ul className="text-sm text-slate-500">
                        {Array.from(byProfessor.entries()).map(([professorName, count]) => (
                          <li key={professorName}>
                            {professorName}: {count}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Nenhuma aula agendada para hoje.</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {units.length === 0 && (
            <p className="text-sm text-slate-500">Nenhuma unidade cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
