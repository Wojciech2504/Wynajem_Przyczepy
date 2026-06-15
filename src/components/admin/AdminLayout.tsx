import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Calendar, Mail, FileText, Settings, LogOut, Globe, ClipboardList } from "lucide-react";
import logoIcon from "@/assets/logo-campgo-icon.png";


export function AdminLayout() {
  const { loading, session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginRoute = location.pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) return;
    if (!loading && (!session || !isAdmin)) navigate({ to: "/admin/login" });
  }, [loading, session, isAdmin, navigate, isLoginRoute]);

  if (isLoginRoute) return <Outlet />;

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Ładowanie...</div>;
  }
  if (!session || !isAdmin) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/kalendarz", label: "Kalendarz", icon: Calendar },
    { to: "/admin/rezerwacje", label: "Rezerwacje", icon: ClipboardList },
    { to: "/admin/wiadomosci", label: "Wiadomości", icon: Mail },
    { to: "/admin/tresci", label: "Treści, cennik i FAQ", icon: FileText },
    { to: "/admin/winiety", label: "Winiety zagraniczne", icon: Globe },
    { to: "/admin/ustawienia", label: "Ustawienia", icon: Settings },
  ];


  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 flex-col border-r border-border bg-card p-4 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 font-display text-lg font-bold">
          <img src={logoIcon} alt="Camp-Go" className="h-9 w-9 rounded-xl object-cover" />
          Camp-Go
        </Link>
        <nav className="flex-1 space-y-1">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-gradient-sunset text-primary-foreground hover:bg-gradient-sunset hover:text-primary-foreground" }}
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
          <LogOut className="h-4 w-4" /> Wyloguj
        </button>
      </aside>

      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-border bg-card p-4 lg:hidden">
          <Link to="/" className="font-display font-bold">Camp-Go</Link>
          <button onClick={logout} className="text-sm text-muted-foreground"><LogOut className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2 lg:hidden">
          {items.map((it) => (
            <Link key={it.to} to={it.to} activeOptions={{ exact: it.exact }}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              activeProps={{ className: "bg-primary text-primary-foreground" }}>
              {it.label}
            </Link>
          ))}
        </div>
        <main className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
