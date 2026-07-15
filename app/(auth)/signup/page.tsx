import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/professor");
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Solicitar acesso</CardTitle>
          <p className="text-sm text-slate-500">
            Preencha seus dados para solicitar acesso como professor. Um
            administrador vai revisar e aprovar seu cadastro.
          </p>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
