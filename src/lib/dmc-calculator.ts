export const TRAILER_DMC = 1800;
export const MAX_B_TOTAL = 3500;
export const MAX_B96_TOTAL = 4250;

export type DmcStatus = "success" | "warning" | "error" | "info";
export type LicenseCategory = "B" | "B96" | "B+E" | "brak";

export type DmcInput = {
  carDmc: number;
  towLimit: number;
  f3?: number | null;
};

export type DmcResult = {
  status: DmcStatus;
  title: string;
  reasons: string[];
  explanation: string;
  license: LicenseCategory;
  technicalOk: boolean;
  totalSet: number;
  carDmc: number;
  towLimit: number;
  trailerDmc: number;
  f3?: number | null;
  f3Exceeded?: boolean;
};

/** Parsuje wartość z inputu – usuwa spacje, przecinki itp. */
export function parseWeight(value: string): number | null {
  if (value == null) return null;
  const cleaned = String(value).replace(/[\s\u00A0]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

export function calculateDmcEligibility({ carDmc, towLimit, f3 }: DmcInput): DmcResult {
  const trailerDmc = TRAILER_DMC;
  const totalSet = carDmc + trailerDmc;
  const technicalOk = towLimit >= trailerDmc;
  const f3Value = f3 ?? null;
  const f3Exceeded = f3Value != null && totalSet > f3Value;

  // F.3 z dowodu przekroczone – twardy błąd
  if (f3Exceeded) {
    return {
      status: "error",
      title: "Na podstawie podanych danych nie możemy potwierdzić, że ten samochód może holować naszą przyczepę. Skontaktuj się z nami przed rezerwacją.",
      reasons: [
        `Suma DMC samochodu i naszej przyczepy (${totalSet} kg) przekracza wartość pola F.3 z dowodu rejestracyjnego (${f3Value} kg).`,
      ],
      explanation:
        "Pole F.3 określa dopuszczalną masę całkowitą zespołu pojazdów. Jeżeli suma DMC samochodu i naszej przyczepy przekracza F.3, taki zestaw nie może legalnie poruszać się po drodze.",
      license: "brak",
      technicalOk: false,
      totalSet,
      carDmc,
      towLimit,
      trailerDmc,
      f3: f3Value,
      f3Exceeded: true,
    };
  }

  // E: oba problemy jednocześnie
  if (!technicalOk && totalSet > MAX_B_TOTAL) {
    return {
      status: "error",
      title:
        "Na podstawie podanych danych nie możemy potwierdzić, że ten samochód może holować naszą przyczepę. Skontaktuj się z nami przed rezerwacją.",
      reasons: [
        "Wartość O.1 jest niższa niż 1800 kg.",
        "Suma DMC zestawu przekracza limit dla kat. B.",
      ],
      explanation:
        "Sam uciąg z pola O.1 wyklucza holowanie tej przyczepy, a dodatkowo suma DMC zestawu przekracza limit kat. B.",
      license: "brak",
      technicalOk,
      totalSet,
      carDmc,
      towLimit,
      trailerDmc,
      f3: f3Value,
    };
  }

  // A: brak technicznej możliwości
  if (!technicalOk) {
    return {
      status: "error",
      title:
        "Na podstawie podanych danych nie możemy potwierdzić, że ten samochód może holować naszą przyczepę. Skontaktuj się z nami przed rezerwacją.",
      reasons: ["Wartość O.1 jest niższa niż 1800 kg, czyli niższa niż DMC naszej przyczepy."],
      explanation: "Sam uciąg z pola O.1 wyklucza holowanie tej przyczepy.",
      license: "brak",
      technicalOk,
      totalSet,
      carDmc,
      towLimit,
      trailerDmc,
      f3: f3Value,
    };
  }

  // B: kat. B
  if (totalSet <= MAX_B_TOTAL) {
    return {
      status: "success",
      title: "Auto spełnia wymagania techniczne do holowania naszej przyczepy.",
      reasons: [
        "Samochód spełnia warunek O.1, a suma DMC zestawu nie przekracza 3500 kg.",
      ],
      explanation:
        "Twój samochód spełnia podstawowe warunki i możesz ciągnąć tę przyczepę na kat. B.",
      license: "B",
      technicalOk,
      totalSet,
      carDmc,
      towLimit,
      trailerDmc,
      f3: f3Value,
    };
  }

  // C: B96
  if (totalSet <= MAX_B96_TOTAL) {
    return {
      status: "warning",
      title:
        "Samochód może holować naszą przyczepę, ale taki zestaw wymaga odpowiednich uprawnień kierowcy: kod 96 / B96 albo B+E.",
      reasons: [
        "Technicznie samochód spełnia wymagania. Suma DMC zestawu przekracza 3500 kg, dlatego sama kategoria B może być niewystarczająca.",
        "Kierowca powinien posiadać kod 96 / B96 albo kategorię B+E.",
        "Jeżeli kierowca posiada kategorię B+E, również może potwierdzić posiadanie odpowiednich uprawnień.",
      ],
      explanation:
        "Technicznie samochód da radę, ale suma DMC zestawu wymaga uprawnień z kodem B96 lub kategorii B+E.",
      license: "B96",
      technicalOk,
      totalSet,
      carDmc,
      towLimit,
      trailerDmc,
      f3: f3Value,
    };
  }

  // D: B+E
  return {
    status: "info",
    title:
      "Samochód może holować naszą przyczepę, ale taki zestaw wymaga kategorii B+E.",
    reasons: ["Warunek O.1 jest spełniony, ale suma DMC zestawu przekracza 4250 kg."],
    explanation:
      "Technicznie samochód da radę, ale suma DMC zestawu wymaga pełnej kategorii B+E.",
    license: "B+E",
    technicalOk,
    totalSet,
    carDmc,
    towLimit,
    trailerDmc,
    f3: f3Value,
  };
}

export function isUnrealisticCarDmc(v: number) {
  return v < 600 || v > 7500;
}
export function isUnrealisticTowLimit(v: number) {
  return v < 200 || v > 7000;
}
