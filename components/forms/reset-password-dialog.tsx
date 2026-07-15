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
  resetProfessorPassword,
  type ResetPasswordFormState,
} from "@/app/admin/professores/actions";

function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function ResetPasswordDialog({
  professorId,
  professorName,
}: {
  professorId: string;
  professorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState<
    ResetPasswordFormState,
    FormData
  >(resetProfessorPassword.bind(null, professorId), undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (!state?.error && !state?.fieldErrors) {
        setOpen(false);
        setPassword("");
        toast.success("Senha redefinida.");
      }
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPassword("");
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Redefinir senha
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha de {professorName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                name="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(generateRandomPassword())}
              >
                Gerar
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Anote ou copie esta senha para repassar ao professor — ela não
              será mostrada novamente.
            </p>
            {state?.fieldErrors?.password && (
              <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
