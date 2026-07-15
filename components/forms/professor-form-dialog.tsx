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
import {
  createProfessor,
  updateProfessor,
  type ProfessorFormState,
} from "@/app/admin/professores/actions";

type Professor = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string;
  cref: string | null;
};

export function ProfessorFormDialog({ professor }: { professor?: Professor }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(professor);
  const action = isEdit
    ? updateProfessor.bind(null, professor!.id)
    : createProfessor;
  const [state, formAction, pending] = useActionState<
    ProfessorFormState,
    FormData
  >(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        toast.success(isEdit ? "Professor atualizado." : "Professor criado.");
      }
    }
    wasPending.current = pending;
  }, [pending, state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />}
      >
        {isEdit ? "Editar" : "Novo professor"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar professor" : "Novo professor"}</DialogTitle>
        </DialogHeader>
        <form key={open ? "open" : "closed"} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={professor?.name} required />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              defaultValue={professor?.address ?? ""}
              required
            />
            {state?.fieldErrors?.address && (
              <p className="text-sm text-red-600">{state.fieldErrors.address[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={professor?.phone ?? ""} required />
            {state?.fieldErrors?.phone && (
              <p className="text-sm text-red-600">{state.fieldErrors.phone[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={professor?.email}
              required
            />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cref">CREF</Label>
            <Input id="cref" name="cref" defaultValue={professor?.cref ?? ""} required />
            {state?.fieldErrors?.cref && (
              <p className="text-sm text-red-600">{state.fieldErrors.cref[0]}</p>
            )}
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input id="password" name="password" type="password" required />
              {state?.fieldErrors?.password && (
                <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
