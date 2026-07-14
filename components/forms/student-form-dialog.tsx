"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trainingLevels } from "@/lib/validations";
import { formatCpf } from "@/lib/cpf";
import {
  createStudent,
  updateStudent,
  type StudentFormState,
} from "@/app/admin/alunos/actions";

type Student = {
  id: string;
  name: string;
  address: string;
  phone: string;
  cpf: string;
  email: string | null;
  trainingLevel: (typeof trainingLevels)[number];
  unitId: string;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianAddress: string | null;
  guardianPhone: string | null;
};

type Unit = { id: string; name: string };

export function StudentFormDialog({
  student,
  units,
}: {
  student?: Student;
  units: Unit[];
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(student);
  const action = isEdit
    ? updateStudent.bind(null, student!.id)
    : createStudent;
  const [state, formAction, pending] = useActionState<
    StudentFormState,
    FormData
  >(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        toast.success(isEdit ? "Aluno atualizado." : "Aluno criado.");
      }
    }
    wasPending.current = pending;
  }, [pending, state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />}
      >
        {isEdit ? "Editar" : "Novo aluno"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>
        <form key={open ? "open" : "closed"} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={student?.name} required />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              defaultValue={student ? formatCpf(student.cpf) : ""}
              required
            />
            {state?.fieldErrors?.cpf && (
              <p className="text-sm text-red-600">{state.fieldErrors.cpf[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" defaultValue={student?.address} required />
            {state?.fieldErrors?.address && (
              <p className="text-sm text-red-600">{state.fieldErrors.address[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={student?.phone} required />
            {state?.fieldErrors?.phone && (
              <p className="text-sm text-red-600">{state.fieldErrors.phone[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input id="email" name="email" type="email" defaultValue={student?.email ?? ""} />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitId">Unidade</Label>
            <Select
              name="unitId"
              defaultValue={student?.unitId}
              items={Object.fromEntries(units.map((unit) => [unit.id, unit.name]))}
              required
            >
              <SelectTrigger id="unitId" className="w-full">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.unitId && (
              <p className="text-sm text-red-600">{state.fieldErrors.unitId[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trainingLevel">Nível de treinamento</Label>
            <Select
              name="trainingLevel"
              defaultValue={student?.trainingLevel}
              required
            >
              <SelectTrigger id="trainingLevel" className="w-full">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                {trainingLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.trainingLevel && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.trainingLevel[0]}
              </p>
            )}
          </div>

          <Separator />
          <p className="text-sm font-medium text-slate-600">
            Responsável (opcional)
          </p>

          <div className="space-y-2">
            <Label htmlFor="guardianName">Nome do responsável</Label>
            <Input
              id="guardianName"
              name="guardianName"
              defaultValue={student?.guardianName ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianRelationship">Parentesco</Label>
            <Input
              id="guardianRelationship"
              name="guardianRelationship"
              defaultValue={student?.guardianRelationship ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianAddress">Endereço do responsável</Label>
            <Input
              id="guardianAddress"
              name="guardianAddress"
              defaultValue={student?.guardianAddress ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Telefone do responsável</Label>
            <Input
              id="guardianPhone"
              name="guardianPhone"
              defaultValue={student?.guardianPhone ?? ""}
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
