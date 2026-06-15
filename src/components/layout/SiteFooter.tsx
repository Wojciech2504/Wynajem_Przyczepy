import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { useSettings } from "@/lib/use-settings";
import logoCampGo from "@/assets/logo-campgo.png";

const POLITYKA_URL =
  "https://pszgymexsedqxfcwtnpg.supabase.co/storage/v1/object/public/documents/1780068822591-polityka-prywatno-ci.pdf";

export function SiteFooter() {
  const s = useSettings();
  return (
    <footer className="mt-24 border-t border-border bg-muted/30">
      <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logoCampGo} alt="" className="h-8 w-auto" />
            <h3 className="font-display text-lg font-bold">Camp-Go</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Wynajem nowoczesnej przyczepy kempingowej. Twoja przygoda zaczyna się tutaj.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Nawigacja</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/oferta" className="hover:text-foreground">Oferta</Link></li>
            
            <li><Link to="/cennik" className="hover:text-foreground">Kalendarz</Link></li>
            <li><Link to="/cennik" className="hover:text-foreground">Cennik</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Dokumenty</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={POLITYKA_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
                Polityka prywatności
              </a>
            </li>
            <li>
              <Link to="/faq" hash="dokumenty-do-pobrania" className="hover:text-foreground">
                Dokumenty do pobrania
              </Link>
            </li>
            <li>
              <Link to="/faq" hash="dokumenty-do-pobrania" className="hover:text-foreground">
                Regulamin wynajmu
              </Link>
            </li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Kontakt</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {s.contactPhone && (
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{s.contactPhone}</span></li>
            )}
            {s.contactEmail && (
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{s.contactEmail}</span></li>
            )}
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <span className="block font-semibold text-foreground">Camp-Go</span>
                <span className="block">ul. Zgórska 37A</span>
                <span className="block">25-827 Kielce, Polska</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Camp-Go. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  );
}
