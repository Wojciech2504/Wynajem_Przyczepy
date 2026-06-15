export const POLITYKA_URL =
  "https://pszgymexsedqxfcwtnpg.supabase.co/storage/v1/object/public/documents/1780068822591-polityka-prywatno-ci.pdf";

export function PrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Wysyłając formularz, potwierdzasz zapoznanie się z{" "}
      <a
        href={POLITYKA_URL}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        Polityką Prywatności
      </a>{" "}
      oraz zasadami przetwarzania danych osobowych w celu obsługi zapytania.
    </p>
  );
}
