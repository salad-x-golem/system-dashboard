export const STORAGE_KEY = "dashboard-machines";

export type MachineType = "provider" | "requestor";

export interface MachineConfig {
  id: string;
  name: string;
  apiUrl: string;
  type: MachineType;
}

export function getMachines(): MachineConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Backwards compatibility: default type to "provider" if not set
      return parsed.map((m: Partial<MachineConfig>) => ({
        ...m,
        type: m.type ?? "provider",
      }));
    }
  } catch {
    console.error("Failed to parse machines from localStorage");
  }
  return [];
}

export function getMachinesByType(type: MachineType): MachineConfig[] {
  return getMachines().filter((m) => m.type === type);
}

export function saveMachines(machines: MachineConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
}

export function addMachine(machine: MachineConfig): MachineConfig[] {
  const machines = getMachines();
  machines.push(machine);
  saveMachines(machines);
  return machines;
}

export function removeMachine(id: string): MachineConfig[] {
  const machines = getMachines().filter((m) => m.id !== id);
  saveMachines(machines);
  return machines;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
