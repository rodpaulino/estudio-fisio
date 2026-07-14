import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/logout";

type NavLink = { href: string; label: string };

export function NavBar({
  title,
  userName,
  links,
}: {
  title: string;
  userName: string;
  links: NavLink[];
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-lg font-semibold">{title}</span>
          <nav className="flex flex-wrap gap-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{userName}</span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
