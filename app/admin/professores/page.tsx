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
import { ProfessorFormDialog } from "@/components/forms/professor-form-dialog";
import { ResetPasswordDialog } from "@/components/forms/reset-password-dialog";
import { prisma } from "@/lib/prisma";
import { toggleProfessorActive } from "./actions";

export default async function ProfessoresPage() {
  const professors = await prisma.user.findMany({
    where: { role: "PROFESSOR" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Professores</h1>
        <ProfessorFormDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>CREF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-48" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {professors.map((professor) => (
            <TableRow key={professor.id}>
              <TableCell className="font-medium">{professor.name}</TableCell>
              <TableCell>{professor.email}</TableCell>
              <TableCell>{professor.cref}</TableCell>
              <TableCell>{professor.phone}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    professor.active
                      ? "default"
                      : professor.pendingApproval
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {professor.active
                    ? "Ativo"
                    : professor.pendingApproval
                      ? "Aguardando aprovação"
                      : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <ProfessorFormDialog professor={professor} />
                  <ResetPasswordDialog
                    professorId={professor.id}
                    professorName={professor.name}
                  />
                  <form
                    action={toggleProfessorActive.bind(
                      null,
                      professor.id,
                      !professor.active
                    )}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      {professor.active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {professors.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500">
                Nenhum professor cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
