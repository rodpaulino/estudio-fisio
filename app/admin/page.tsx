import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [unitCount, professorCount, studentCount, pendingRequests] =
    await Promise.all([
      prisma.unit.count(),
      prisma.user.count({ where: { role: "PROFESSOR", active: true } }),
      prisma.student.count({ where: { active: true } }),
      prisma.scheduleChangeRequest.count({ where: { status: "PENDING" } }),
    ]);

  const stats = [
    { label: "Unidades", value: unitCount },
    { label: "Professores ativos", value: professorCount },
    { label: "Alunos ativos", value: studentCount },
    { label: "Aprovações pendentes", value: pendingRequests },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
