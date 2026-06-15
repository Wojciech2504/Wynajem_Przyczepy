import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import logoIcon from "@/assets/logo-campgo-icon.png";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Start" },
  { to: "/oferta", label: "Oferta" },
  { to: "/cennik", label: "Terminy wynajmu / Cennik" },
  { to: "/kalkulator-dmc", label: "Sprawdź swoje auto" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

const SEARCH_ITEMS = [
  { label: "Start", to: "/" },
  { label: "Oferta", to: "/oferta" },
  { label: "Terminy wynajmu / Cennik", to: "/cennik" },
  { label: "Sprawdź swoje auto", to: "/kalkulator-dmc" },
  { label: "FAQ", to: "/faq" },
  { label: "Kontakt", to: "/kontakt" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <img src={logoIcon} alt="Camp-Go" className="h-9 w-9 rounded-xl object-cover" />
          <span>Camp-Go</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:px-3 lg:text-sm"
              activeProps={{ className: "text-foreground bg-muted" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center justify-center rounded-full px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Wyszukaj"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-full p-2 md:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("md:hidden", open ? "block" : "hidden")}>
        <nav className="container mx-auto flex max-w-7xl flex-col gap-1 border-t border-border px-4 py-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => { setOpen(false); setSearchOpen(true); }}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Search className="h-4 w-4" /> Wyszukaj
          </button>
        </nav>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Wyszukaj na stronie…" />
        <CommandList>
          <CommandEmpty>Nie znaleziono wyników.</CommandEmpty>
          <CommandGroup heading="Strony">
            {SEARCH_ITEMS.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate({ to: item.to });
                }}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
