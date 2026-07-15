import { requireUser } from "@/lib/auth-guard";
import { NavBar } from "@/components/nav-bar";
import { IdleLogout } from "@/components/idle-logout";

const links = [
  { href: "/professor", label: "Minhas Aulas" },
  { href: "/professor/alunos", label: "Alunos" },
  { href: "/professor/historico", label: "Meu Histórico" },
];

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("PROFESSOR");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <IdleLogout />
      <NavBar title="Estúdio Fisio · Professor" userName={user.name ?? ""} links={links} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
