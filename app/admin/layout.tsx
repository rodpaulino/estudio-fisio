import { requireUser } from "@/lib/auth-guard";
import { NavBar } from "@/components/nav-bar";
import { IdleLogout } from "@/components/idle-logout";

const links = [
  { href: "/admin", label: "Início" },
  { href: "/admin/unidades", label: "Unidades" },
  { href: "/admin/professores", label: "Professores" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/aulas", label: "Aulas" },
  { href: "/admin/aprovacoes", label: "Aprovações" },
  { href: "/admin/relatorios", label: "Relatórios" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("ADMIN");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <IdleLogout />
      <NavBar title="Estúdio Fisio · Admin" userName={user.name ?? ""} links={links} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
