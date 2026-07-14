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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  requestScheduleChange,
  type ChangeRequestFormState,
} from "@/app/professor/actions";

type Professor = { id: string; name: string };

export function RequestChangeDialog({
  classSessionId,
  professors,
  alreadyRequested,
}: {
  classSessionId: string;
  professors: Professor[];
  alreadyRequested: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"PROFESSOR_CHANGE" | "TIME_CHANGE">(
    "PROFESSOR_CHANGE"
  );
  const [state, formAction, pending] = useActionState<
    ChangeRequestFormState,
    FormData
  >(requestScheduleChange, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        toast.success("Solicitação enviada.");
      }
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (alreadyRequested) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Troca solicitada
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Solicitar troca
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar troca</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="classSessionId" value={classSessionId} />

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de troca</Label>
            <Select
              name="type"
              value={type}
              onValueChange={(value) =>
                setType(value as "PROFESSOR_CHANGE" | "TIME_CHANGE")
              }
              items={{
                PROFESSOR_CHANGE: "Troca de professor",
                TIME_CHANGE: "Troca de horário",
              }}
              required
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFESSOR_CHANGE">Troca de professor</SelectItem>
                <SelectItem value="TIME_CHANGE">Troca de horário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "PROFESSOR_CHANGE" && (
            <div className="space-y-2">
              <Label htmlFor="proposedProfessorId">Professor proposto</Label>
              <Select
                name="proposedProfessorId"
                items={Object.fromEntries(
                  professors.map((professor) => [professor.id, professor.name])
                )}
                required
              >
                <SelectTrigger id="proposedProfessorId" className="w-full">
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
              {state?.fieldErrors?.proposedProfessorId && (
                <p className="text-sm text-red-600">
                  {state.fieldErrors.proposedProfessorId[0]}
                </p>
              )}
            </div>
          )}

          {type === "TIME_CHANGE" && (
            <div className="space-y-2">
              <Label htmlFor="proposedScheduledAt">Novo horário</Label>
              <Input
                id="proposedScheduledAt"
                name="proposedScheduledAt"
                type="datetime-local"
                required
              />
              {state?.fieldErrors?.proposedScheduledAt && (
                <p className="text-sm text-red-600">
                  {state.fieldErrors.proposedScheduledAt[0]}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" name="reason" required />
            {state?.fieldErrors?.reason && (
              <p className="text-sm text-red-600">{state.fieldErrors.reason[0]}</p>
            )}
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
