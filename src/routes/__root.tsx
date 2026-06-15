import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-sunset">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Nie znaleziono strony</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-sunset px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Coś poszło nie tak</h1>
        <p className="mt-2 text-sm text-muted-foreground">Spróbuj odświeżyć stronę.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Spróbuj ponownie
          </button>
          <a href="/" className="rounded-full border border-input px-4 py-2 text-sm font-medium">Strona główna</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CampGo – Wynajem przyczep kempingowych" },
      { name: "description", content: "Wynajmij nowoczesną przyczepę kempingową. Sprawdź dostępność i zarezerwuj swoją przygodę." },
      { property: "og:title", content: "CampGo – Wynajem przyczep kempingowych" },
      { property: "og:description", content: "Wynajmij nowoczesną przyczepę kempingową. Sprawdź dostępność i zarezerwuj swoją przygodę." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "CampGo – Wynajem przyczep kempingowych" },
      { name: "twitter:description", content: "Wynajmij nowoczesną przyczepę kempingową. Sprawdź dostępność i zarezerwuj swoją przygodę." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93452004-44d8-4340-b429-ee12afd5ed95/id-preview-3f57c762--097b73c2-9983-46d1-86fd-f44057a221f7.lovable.app-1780000676944.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93452004-44d8-4340-b429-ee12afd5ed95/id-preview-3f57c762--097b73c2-9983-46d1-86fd-f44057a221f7.lovable.app-1780000676944.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function AuthListener() {
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [queryClient, router]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
