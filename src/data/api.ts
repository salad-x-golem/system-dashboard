import { getMachines, type MachineConfig } from "@/lib/machines-storage";

// API response type (from backend)
export type ProviderStatus = "unknown" | "waiting" | "working";

export interface ProviderApiResponse {
  yagna_service: string;
  yagna_pids: number[];
  yagna_running: boolean;
  provider_service: string;
  provider_pids: number[];
  provider_running: boolean;
  id: string;
  status: ProviderStatus;
  last_seen: string;
  latency_ms: number | null;
  notes: string | null;
  work: unknown | null;
}

// Transformed types for UI
export interface Provider {
  id: string;
  name: string;
  status: ProviderStatus;
  yagna_running: boolean;
  provider_running: boolean;
  work: boolean;
  last_seen: string;
  latency_ms: number | null;
  notes: string | null;
}

export interface MachineSummary {
  working: number;
  waiting: number;
  unknown: number;
  total: number;
  yagna_running: number;
  provider_running: number;
  working_percent: number;
}

export interface Machine {
  machine_id: string;
  hostname: string;
  name: string;
  location: string;
  reported_at: string;
  summary: MachineSummary;
}

export interface MachineWithProviders extends Machine {
  providers: Provider[];
}

// Transform API response to Provider
function transformProvider(apiProvider: ProviderApiResponse): Provider {
  return {
    id: apiProvider.id,
    name: apiProvider.provider_service || "provider",
    status: apiProvider.status,
    yagna_running: apiProvider.yagna_running,
    provider_running: apiProvider.provider_running,
    work: Boolean(apiProvider.work),
    last_seen: apiProvider.last_seen,
    latency_ms: apiProvider.latency_ms,
    notes: apiProvider.notes,
  };
}

// Calculate summary from providers
function calculateSummary(providers: Provider[]): MachineSummary {
  const working = providers.filter((p) => p.status === "working").length;
  const waiting = providers.filter((p) => p.status === "waiting").length;
  const unknown = providers.filter((p) => p.status === "unknown").length;
  const yagna_running = providers.filter((p) => p.yagna_running).length;
  const provider_running = providers.filter((p) => p.provider_running).length;
  const total = providers.length;

  return {
    working,
    waiting,
    unknown,
    total,
    yagna_running,
    provider_running,
    working_percent: total > 0 ? Math.round((working / total) * 1000) / 10 : 0,
  };
}

// Fetch providers for a specific machine
export async function fetchMachineProviders(
  machineId: string
): Promise<Provider[]> {
  const machines = getMachines();
  const machineConfig = machines.find((m) => m.id === machineId);
  if (!machineConfig) {
    throw new Error(`Machine ${machineId} not found`);
  }

  const response = await fetch(machineConfig.apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch providers for ${machineId}`);
  }
  const data: ProviderApiResponse[] = await response.json();
  return data.map(transformProvider);
}

// Fetch machine with providers
export async function fetchMachineWithProviders(
  machineId: string
): Promise<MachineWithProviders | null> {
  const machines = getMachines();
  const machineConfig = machines.find((m) => m.id === machineId);
  if (!machineConfig) {
    return null;
  }

  const providers = await fetchMachineProviders(machineId);
  const summary = calculateSummary(providers);

  return {
    machine_id: machineConfig.id,
    hostname: machineConfig.name,
    name: machineConfig.name,
    location: machineConfig.location,
    reported_at: new Date().toISOString(),
    summary,
    providers,
  };
}

// Fetch all machines with their summaries
export async function fetchAllMachines(): Promise<Machine[]> {
  const machines = getMachines();
  const results = await Promise.all(
    machines.map(async (machineConfig: MachineConfig) => {
      try {
        const response = await fetch(machineConfig.apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch`);
        }
        const data: ProviderApiResponse[] = await response.json();
        const providers = data.map(transformProvider);
        const summary = calculateSummary(providers);
        return {
          machine_id: machineConfig.id,
          hostname: machineConfig.name,
          name: machineConfig.name,
          location: machineConfig.location,
          reported_at: new Date().toISOString(),
          summary,
        };
      } catch (error) {
        console.error(
          `Failed to fetch machine ${machineConfig.id}:`,
          error
        );
        // Return machine with empty summary on error
        return {
          machine_id: machineConfig.id,
          hostname: machineConfig.name,
          name: machineConfig.name,
          location: machineConfig.location,
          reported_at: new Date().toISOString(),
          summary: {
            working: 0,
            waiting: 0,
            unknown: 0,
            total: 0,
            yagna_running: 0,
            provider_running: 0,
            working_percent: 0,
          },
        };
      }
    })
  );

  return results;
}

// Get a single machine (without providers)
export async function fetchMachine(machineId: string): Promise<Machine | null> {
  const machines = getMachines();
  const machineConfig = machines.find((m) => m.id === machineId);
  if (!machineConfig) {
    return null;
  }

  try {
    const providers = await fetchMachineProviders(machineId);
    const summary = calculateSummary(providers);
    return {
      machine_id: machineConfig.id,
      hostname: machineConfig.name,
      name: machineConfig.name,
      location: machineConfig.location,
      reported_at: new Date().toISOString(),
      summary,
    };
  } catch {
    return null;
  }
}
