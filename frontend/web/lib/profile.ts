// The farmer's own farm details, kept on this device only and sent with each question
// so answers fit their district, farm size and what they have.
import type { Crop } from "./strings";

export interface FarmerProfile {
  district?: string;
  farm_size_ha?: number;
  crops: Crop[];
  irrigation?: boolean;
  livestock?: boolean;
  notes?: string;
}

const KEY = "santech-profile";

export const RWANDA_DISTRICTS = [
  "Bugesera", "Burera", "Gakenke", "Gasabo", "Gatsibo", "Gicumbi", "Gisagara", "Huye",
  "Kamonyi", "Karongi", "Kayonza", "Kicukiro", "Kirehe", "Muhanga", "Musanze", "Ngoma",
  "Ngororero", "Nyabihu", "Nyagatare", "Nyamagabe", "Nyamasheke", "Nyanza", "Nyarugenge",
  "Nyaruguru", "Rubavu", "Ruhango", "Rulindo", "Rusizi", "Rutsiro", "Rwamagana",
];

export const emptyProfile: FarmerProfile = { crops: [] };

export function loadProfile(): FarmerProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptyProfile, ...JSON.parse(raw) } : emptyProfile;
  } catch {
    return emptyProfile;
  }
}

export function saveProfile(p: FarmerProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private window or blocked storage: the profile just is not remembered.
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function hasProfile(p: FarmerProfile): boolean {
  return Boolean(
    p.district || p.farm_size_ha || p.crops.length || p.irrigation !== undefined ||
      p.livestock !== undefined || p.notes,
  );
}

/** Only what the API accepts; undefined when the farmer has not filled anything in. */
export function profileForApi(p: FarmerProfile): FarmerProfile | undefined {
  return hasProfile(p) ? p : undefined;
}

/** Rwanda's farming season for a month, same rule as the backend prompt. */
export function seasonOf(month: number): "A" | "B" | "C" {
  if (month >= 9 || month === 1) return "A";
  if (month >= 2 && month <= 6) return "B";
  return "C";
}
