import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "PROFESSOR";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "PROFESSOR";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "PROFESSOR";
  }
}
