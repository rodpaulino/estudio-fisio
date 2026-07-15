import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/professor");
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Estúdio Fisio</CardTitle>
          <p className="text-sm text-slate-500">
            Entre com seu email e senha
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <p className="text-center text-sm text-slate-500">
            Ainda não tem acesso?{" "}
            <Link href="/signup" className="text-primary underline underline-offset-4">
              Solicitar criação de usuário
            </Link>
          </p>
          <p className="text-center text-sm text-slate-500">
            Esqueceu sua senha? Peça para o administrador do estúdio
            redefinir na tela de Professores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
