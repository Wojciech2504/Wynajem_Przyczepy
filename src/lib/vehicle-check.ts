import { useEffect, useState } from "react";

export type VehicleCheckState = {
  technicalOk: boolean;
  licenseConfirmed: boolean;
  totalSet: number;
  license: string;
  savedAt: number;
};

export const VEHICLE_CHECK_KEY = "campgo.vehicleCheck";
const EVENT_NAME = "campgo:vehicle-check-updated";

function read(): VehicleCheckState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(VEHICLE_CHECK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VehicleCheckState;
  } catch {
    return null;
  }
}

export function saveVehicleCheck(s: VehicleCheckState) {
  try {
    sessionStorage.setItem(VEHICLE_CHECK_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {}
}

export function clearVehicleCheck() {
  try {
    sessionStorage.removeItem(VEHICLE_CHECK_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {}
}

export function useVehicleCheck() {
  const [state, setState] = useState<VehicleCheckState | null>(null);

  useEffect(() => {
    setState(read());
    const onUpdate = () => setState(read());
    window.addEventListener(EVENT_NAME, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const passed = !!state && state.technicalOk && state.licenseConfirmed;
  return { state, passed };
}
