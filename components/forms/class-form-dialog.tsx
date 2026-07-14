"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_STUDENTS_PER_CLASS } from "@/lib/pricing";
import {
  createClassSession,
  type ClassSessionFormState,
} from "@/app/admin/aulas/actions";

type Unit = { id: string; name: string };
type Professor = { id: string; name: string };
type StudentOption = { id: string; name: string; unitId: string };

export function ClassFormDialog({
  units,
  professors,
  students,
}: {
  units: Unit[];
  professors: Professor[];
  students: StudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ClassSessionFormState,
    FormData
  >(createClassSession, undefined);
  const wasPending = useRef(false);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        setUnitId(null);
        setSelectedStudentIds([]);
        toast.success("Aula agendada.");
      }
    }
    wasPending.current = pending;
  }, [pending, state]);

  const availableStudents = useMemo(
    () => students.filter((student) => student.unitId === unitId),
    [students, unitId]
  );

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : prev.length < MAX_STUDENTS_PER_CLASS
          ? [...prev, id]
          : prev
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setUnitId(null);
          setSelectedStudentIds([]);
        }
      }}
    >
      <DialogTrigger render={<Button />}>Nova aula</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova aula</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unitId">Unidade</Label>
            <Select
              name="unitId"
              value={unitId}
              onValueChange={(value) => {
                setUnitId(value as string);
                setSelectedStudentIds([]);
              }}
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
            <Label htmlFor="professorId">Professor</Label>
            <Select
              name="professorId"
              items={Object.fromEntries(
                professors.map((professor) => [professor.id, professor.name])
              )}
              required
            >
              <SelectTrigger id="professorId" className="w-full">
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                {professors.map((professor) => (
                  <SelectItem key={professor.id} value={professor.id}>
                    {professor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.professorId && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.professorId[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Data e hora</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
            {state?.fieldErrors?.scheduledAt && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.scheduledAt[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Alunos (máx. {MAX_STUDENTS_PER_CLASS})</Label>
            <div className="space-y-1 rounded-lg border p-2">
              {!unitId && (
                <p className="text-sm text-slate-500">
                  Selecione a unidade para ver os alunos.
                </p>
              )}
              {unitId && availableStudents.length === 0 && (
                <p className="text-sm text-slate-500">
                  Nenhum aluno ativo nesta unidade.
                </p>
              )}
              {availableStudents.map((student) => {
                const checked = selectedStudentIds.includes(student.id);
                return (
                  <label key={student.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="studentIds"
                      value={student.id}
                      checked={checked}
                      onChange={() => toggleStudent(student.id)}
                      disabled={
                        !checked && selectedStudentIds.length >= MAX_STUDENTS_PER_CLASS
                      }
                    />
                    {student.name}
                  </label>
                );
              })}
            </div>
            {state?.fieldErrors?.studentIds && (
              <p className="text-sm text-red-600">{state.fieldErrors.studentIds[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Agendando..." : "Agendar aula"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
