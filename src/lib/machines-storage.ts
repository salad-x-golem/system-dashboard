const STORAGE_KEY = "dashboard-machines";

export interface MachineConfig {
  id: string;
  name: string;
  location: string;
  apiUrl: string;
}

export function getMachines(): MachineConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error("Failed to parse machines from localStorage");
  }
  return [];
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
