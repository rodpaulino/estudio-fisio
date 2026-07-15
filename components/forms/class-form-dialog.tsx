"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
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

const WEEKDAY_OPTIONS = [
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
];

function isWeekend(datetimeLocalValue: string): boolean {
  const day = new Date(datetimeLocalValue).getDay();
  return day === 0 || day === 6;
}

export function ClassFormDialog({
  units,
  professors,
  students,
  fixedProfessorId,
  triggerLabel = "Nova aula",
}: {
  units: Unit[];
  professors?: Professor[];
  students: StudentOption[];
  fixedProfessorId?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ClassSessionFormState,
    FormData
  >(createClassSession, undefined);
  const wasPending = useRef(false);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const scheduledAtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        setUnitId(null);
        setSelectedStudentIds([]);
        setMode("single");
        setSelectedWeekdays([]);
        toast.success(
          mode === "recurring" ? "Aulas agendadas." : "Aula agendada."
        );
      }
    }
    wasPending.current = pending;
  }, [pending, state, mode]);

  function toggleWeekday(value: string) {
    setSelectedWeekdays((prev) =>
      prev.includes(value)
        ? prev.filter((day) => day !== value)
        : [...prev, value]
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (mode === "single" && scheduledAtRef.current?.value) {
      if (isWeekend(scheduledAtRef.current.value)) {
        event.preventDefault();
        toast.error("Não é possível agendar aulas aos sábados ou domingos.");
      }
    }
  }

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
          setMode("single");
          setSelectedWeekdays([]);
        }
      }}
    >
      <DialogTrigger render={<Button />}>{triggerLabel}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova aula</DialogTitle>
        </DialogHeader>
        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="mode" value={mode} />
          <div className="flex gap-2 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "single"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Aula única
            </button>
            <button
              type="button"
              onClick={() => setMode("recurring")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "recurring"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Aulas recorrentes
            </button>
          </div>

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

          {professors ? (
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
          ) : (
            <input type="hidden" name="professorId" value={fixedProfessorId} />
          )}

          {mode === "single" ? (
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Data e hora</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                ref={scheduledAtRef}
                required
              />
              <p className="text-xs text-slate-500">
                Não são permitidos agendamentos aos sábados ou domingos.
              </p>
              {state?.fieldErrors?.scheduledAt && (
                <p className="text-sm text-red-600">
                  {state.fieldErrors.scheduledAt[0]}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((day) => {
                    const checked = selectedWeekdays.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm ${
                          checked
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="weekdays"
                          value={day.value}
                          checked={checked}
                          onChange={() => toggleWeekday(day.value)}
                          className="sr-only"
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
                {state?.fieldErrors?.weekdays && (
                  <p className="text-sm text-red-600">{state.fieldErrors.weekdays[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input id="time" name="time" type="time" required />
                {state?.fieldErrors?.time && (
                  <p className="text-sm text-red-600">{state.fieldErrors.time[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de início</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    required
                  />
                  {state?.fieldErrors?.startDate && (
                    <p className="text-sm text-red-600">
                      {state.fieldErrors.startDate[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de término</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                  {state?.fieldErrors?.endDate && (
                    <p className="text-sm text-red-600">{state.fieldErrors.endDate[0]}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Agendando..."
              : mode === "recurring"
                ? "Agendar aulas"
                : "Agendar aula"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
