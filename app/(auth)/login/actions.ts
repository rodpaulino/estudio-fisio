"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email ou senha inválidos." };
      }
      return { error: "Não foi possível entrar. Tente novamente." };
    }
    throw error;
  }
}
