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
import { StudentFormDialog } from "@/components/forms/student-form-dialog";
import { prisma } from "@/lib/prisma";
import { formatCpf } from "@/lib/cpf";
import { toggleStudentActive } from "./actions";

export default async function AlunosPage() {
  const [students, units] = await Promise.all([
    prisma.student.findMany({
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alunos</h1>
        <StudentFormDialog units={units} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-48" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{formatCpf(student.cpf)}</TableCell>
              <TableCell>{student.unit.name}</TableCell>
              <TableCell>{student.trainingLevel}</TableCell>
              <TableCell>{student.phone}</TableCell>
              <TableCell>
                <Badge variant={student.active ? "default" : "secondary"}>
                  {student.active ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <StudentFormDialog student={student} units={units} />
                  <form
                    action={toggleStudentActive.bind(
                      null,
                      student.id,
                      !student.active
                    )}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      {student.active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-500">
                Nenhum aluno cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
