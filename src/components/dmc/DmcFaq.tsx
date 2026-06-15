import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Co to jest DMC przyczepy?",
    a: "DMC, czyli dopuszczalna masa całkowita przyczepy, to maksymalna masa, z jaką przyczepa może legalnie poruszać się po drodze razem z ładunkiem. Jest to wartość zapisana w dowodzie rejestracyjnym i nie wolno jej przekraczać.",
  },
  {
    q: "Czy naszą przyczepę 1800 kg można ciągnąć na kategorię B?",
    a: "To zależy od dwóch rzeczy: wartości pola O.1 Twojego samochodu oraz łącznej sumy DMC samochodu i przyczepy. Jeśli O.1 wynosi co najmniej 1800 kg, a cały zestaw nie przekracza 3500 kg – tak, wystarczy kategoria B.",
  },
  {
    q: "Co jeśli suma zestawu przekracza 3500 kg?",
    a: "Jeśli mieścisz się do 4250 kg, potrzebujesz prawa jazdy kategorii B z kodem 96. Powyżej 4250 kg konieczna jest pełna kategoria B+E.",
  },
  {
    q: "Czy mogę patrzeć na O.2 zamiast O.1?",
    a: "Nie w tym przypadku. Pole O.2 dotyczy przyczep bez hamulca. Nasza przyczepa jest traktowana jako przyczepa z hamulcem, dlatego decydujące jest pole O.1.",
  },
  {
    q: "Czy ten kalkulator daje ostateczną decyzję prawną?",
    a: "Nie. To narzędzie pomocnicze. Ostatecznie zawsze należy sprawdzić dane swojego pojazdu w dokumentach oraz upewnić się, że posiadasz odpowiednie uprawnienia.",
  },
];

export function DmcFaq() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">Najczęstsze pytania</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Krótkie odpowiedzi na pytania, które najczęściej zadają nasi klienci.
      </p>
      <Accordion type="single" collapsible className="mt-4">
        {FAQ.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base font-semibold">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
