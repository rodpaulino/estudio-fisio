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
import { createUnit, updateUnit, type UnitFormState } from "@/app/admin/unidades/actions";

type Unit = { id: string; name: string; address: string };

export function UnitFormDialog({ unit }: { unit?: Unit }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(unit);
  const action = isEdit ? updateUnit.bind(null, unit!.id) : createUnit;
  const [state, formAction, pending] = useActionState<UnitFormState, FormData>(
    action,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        toast.success(isEdit ? "Unidade atualizada." : "Unidade criada.");
      }
    }
    wasPending.current = pending;
  }, [pending, state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />}
      >
        {isEdit ? "Editar" : "Nova unidade"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar unidade" : "Nova unidade"}</DialogTitle>
        </DialogHeader>
        <form key={open ? "open" : "closed"} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da unidade</Label>
            <Input id="name" name="name" defaultValue={unit?.name} required />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" defaultValue={unit?.address} required />
            {state?.fieldErrors?.address && (
              <p className="text-sm text-red-600">{state.fieldErrors.address[0]}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
