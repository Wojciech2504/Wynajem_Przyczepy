import { ExternalLink, View, Info } from "lucide-react";

export const Offer360View = () => {
  const tourUrl = "https://data.hobby-caravan.de/fileadmin_360_views/user_upload_360_views/2026/WW/EXCELLENT_495_WFB/index.htm";

  return (
    <div className="w-full max-w-4xl mx-auto my-6 bg-card rounded-xl shadow-soft border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-lg">
          <View className="w-5 h-5 text-primary" />
          Wirtualny spacer 360° - Hobby Excellent 495 WFB
        </h3>
      </div>

      <div className="relative w-full bg-muted/50 flex items-center justify-center min-h-[300px] md:min-h-[350px]">
        <div className="text-center p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 shadow-inner">
            <View className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-medium text-foreground mb-2">
            Zobacz wnętrze przyczepy z każdej strony
          </h4>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Wirtualny spacer otworzy się na stronie producenta w nowej karcie przeglądarki.
          </p>
          <a
            href={tourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors shadow-md flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Otwórz widok 360°
          </a>
        </div>
      </div>

      <div className="p-3 bg-primary/5 text-sm text-primary flex items-start gap-2 border-t border-primary/10">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Wskazówka:</strong> Możesz obracać widok przesuwając palcem po ekranie (lub myszką na komputerze). Klikaj w migające punkty nawigacyjne na podłodze, aby przejść do sypialni lub łazienki.
        </p>
      </div>
    </div>
  );
};

export default Offer360View;
