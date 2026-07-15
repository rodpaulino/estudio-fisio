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
import { prisma } from "@/lib/prisma";
import {
  approveChangeRequest,
  rejectChangeRequest,
  approveProfessorSignup,
  rejectProfessorSignup,
} from "./actions";

const typeLabels: Record<string, string> = {
  PROFESSOR_CHANGE: "Troca de professor",
  TIME_CHANGE: "Troca de horário",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "default",
  APPROVED: "secondary",
  REJECTED: "destructive",
};

function describeProposal(request: {
  type: string;
  proposedProfessor: { name: string } | null;
  proposedScheduledAt: Date | null;
}) {
  if (request.type === "PROFESSOR_CHANGE") {
    return request.proposedProfessor?.name ?? "-";
  }
  return request.proposedScheduledAt
    ? format(request.proposedScheduledAt, "dd/MM/yyyy HH:mm")
    : "-";
}

export default async function AprovacoesPage() {
  const [pending, history, pendingSignups] = await Promise.all([
    prisma.scheduleChangeRequest.findMany({
      where: { status: "PENDING" },
      include: {
        classSession: { include: { unit: true, professor: true } },
        requestedBy: true,
        proposedProfessor: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.scheduleChangeRequest.findMany({
      where: { status: { not: "PENDING" } },
      include: {
        classSession: { include: { unit: true, professor: true } },
        requestedBy: true,
        proposedProfessor: true,
        reviewedBy: true,
      },
      orderBy: { reviewedAt: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: { role: "PROFESSOR", pendingApproval: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Aprovações</h1>
        <p className="text-sm text-slate-500">
          Solicitações de cadastro de professor e de troca de professor ou
          horário.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Solicitações de cadastro</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CREF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingSignups.map((signup) => (
              <TableRow key={signup.id}>
                <TableCell className="font-medium">{signup.name}</TableCell>
                <TableCell>{signup.email}</TableCell>
                <TableCell>{signup.cref}</TableCell>
                <TableCell>{signup.phone}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <form action={approveProfessorSignup.bind(null, signup.id)}>
                      <Button type="submit" size="sm">
                        Aprovar
                      </Button>
                    </form>
                    <form action={rejectProfessorSignup.bind(null, signup.id)}>
                      <Button type="submit" variant="destructive" size="sm">
                        Rejeitar
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pendingSignups.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  Nenhuma solicitação de cadastro pendente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Pendentes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aula</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Solicitado por</TableHead>
              <TableHead>Proposta</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.classSession.unit.name} ·{" "}
                  {format(request.classSession.scheduledAt, "dd/MM/yyyy HH:mm")}
                  <div className="text-xs text-slate-500">
                    Professor atual: {request.classSession.professor.name}
                  </div>
                </TableCell>
                <TableCell>{typeLabels[request.type]}</TableCell>
                <TableCell>{request.requestedBy.name}</TableCell>
                <TableCell>{describeProposal(request)}</TableCell>
                <TableCell className="max-w-xs">{request.reason}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <form action={approveChangeRequest.bind(null, request.id)}>
                      <Button type="submit" size="sm">
                        Aprovar
                      </Button>
                    </form>
                    <form action={rejectChangeRequest.bind(null, request.id)}>
                      <Button type="submit" variant="destructive" size="sm">
                        Rejeitar
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pending.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500">
                  Nenhuma aprovação pendente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Histórico</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aula</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Solicitado por</TableHead>
              <TableHead>Proposta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Revisado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.classSession.unit.name} ·{" "}
                  {format(request.classSession.scheduledAt, "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>{typeLabels[request.type]}</TableCell>
                <TableCell>{request.requestedBy.name}</TableCell>
                <TableCell>{describeProposal(request)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </TableCell>
                <TableCell>{request.reviewedBy?.name ?? "-"}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500">
                  Nenhuma solicitação revisada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
