"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSignup, type SignupFormState } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupFormState, FormData>(
    requestSignup,
    undefined
  );

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600">
          Solicitação enviada! Assim que um administrador aprovar seu cadastro,
          você poderá entrar normalmente com o email e a senha que definiu.
        </p>
        <Link
          href="/login"
          className="text-sm text-primary underline underline-offset-4"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" required />
        {state?.fieldErrors?.address && (
          <p className="text-sm text-red-600">{state.fieldErrors.address[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" required />
        {state?.fieldErrors?.phone && (
          <p className="text-sm text-red-600">{state.fieldErrors.phone[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="cref">CREF</Label>
        <Input id="cref" name="cref" required />
        {state?.fieldErrors?.cref && (
          <p className="text-sm text-red-600">{state.fieldErrors.cref[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        {state?.fieldErrors?.password && (
          <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
        )}
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Solicitar cadastro"}
      </Button>
    </form>
  );
}
