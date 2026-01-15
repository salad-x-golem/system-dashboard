import { getMachinesByType, type MachineConfig } from "@/lib/machines-storage";

// Worker states
export type WorkerState =
  | "idle"
  | "waiting_for_rental"
  | "initializing_estimator"
  | "running_command"
  | "processing_results"
  | "releasing_rental"
  | "destroying_rental"
  | "error"
  | "stopped";

// API response types
export interface WorkerStatus {
  workerNo: number;
  state: WorkerState;
  currentProvider?: string;
  currentProviderId?: string;
  currentAgreementId?: string;
  currentIterationNo?: number;
  successfulIterations: number;
  failedIterations: number;
  lastUpdateTimestamp: string;
  lastError?: string;
}

export interface SystemStatus {
  workers: WorkerStatus[];
  totalSuccessfulIterations: number;
  totalFailedIterations: number;
  activeWorkers: number;
  idleWorkers: number;
  errorWorkers: number;
  timestamp: string;
}

// UI types
export interface RequestorSummary {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  errorWorkers: number;
  totalSuccessfulIterations: number;
  totalFailedIterations: number;
  healthPercent: number;
}

export interface Requestor {
  requestor_id: string;
  name: string;
  reported_at: string;
  summary: RequestorSummary;
  isOnline: boolean;
}

export interface RequestorWithWorkers extends Requestor {
  workers: WorkerStatus[];
}

// Calculate summary from system status
function calculateRequestorSummary(status: SystemStatus): RequestorSummary {
  const totalWorkers = status.workers.length;
  const healthPercent =
    totalWorkers > 0
      ? Math.round((status.activeWorkers / totalWorkers) * 1000) / 10
      : 0;

  return {
    totalWorkers,
    activeWorkers: status.activeWorkers,
    idleWorkers: status.idleWorkers,
    errorWorkers: status.errorWorkers,
    totalSuccessfulIterations: status.totalSuccessfulIterations,
    totalFailedIterations: status.totalFailedIterations,
    healthPercent,
  };
}

// Create offline summary
function createOfflineSummary(): RequestorSummary {
  return {
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    errorWorkers: 0,
    totalSuccessfulIterations: 0,
    totalFailedIterations: 0,
    healthPercent: 0,
  };
}

// Fetch system status for a specific requestor
export async function fetchRequestorStatus(
  requestorId: string
): Promise<RequestorWithWorkers | null> {
  const requestors = getMachinesByType("requestor");
  const requestorConfig = requestors.find((r) => r.id === requestorId);
  if (!requestorConfig) {
    return null;
  }

  try {
    const response = await fetch(requestorConfig.apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch requestor status`);
    }
    const data: SystemStatus = await response.json();
    const summary = calculateRequestorSummary(data);

    return {
      requestor_id: requestorConfig.id,
      name: requestorConfig.name,
      reported_at: data.timestamp,
      summary,
      isOnline: true,
      workers: data.workers,
    };
  } catch (error) {
    console.error(`Failed to fetch requestor ${requestorId}:`, error);
    // Return requestor as offline on error
    return {
      requestor_id: requestorConfig.id,
      name: requestorConfig.name,
      reported_at: new Date().toISOString(),
      summary: createOfflineSummary(),
      isOnline: false,
      workers: [],
    };
  }
}

// Fetch all requestors with their summaries
export async function fetchAllRequestors(): Promise<Requestor[]> {
  const requestors = getMachinesByType("requestor");
  const results = await Promise.all(
    requestors.map(async (requestorConfig: MachineConfig) => {
      try {
        const response = await fetch(requestorConfig.apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch`);
        }
        const data: SystemStatus = await response.json();
        const summary = calculateRequestorSummary(data);
        return {
          requestor_id: requestorConfig.id,
          name: requestorConfig.name,
          reported_at: data.timestamp,
          summary,
          isOnline: true,
        };
      } catch (error) {
        console.error(
          `Failed to fetch requestor ${requestorConfig.id}:`,
          error
        );
        // Return requestor as offline on error
        return {
          requestor_id: requestorConfig.id,
          name: requestorConfig.name,
          reported_at: new Date().toISOString(),
          summary: createOfflineSummary(),
          isOnline: false,
        };
      }
    })
  );

  return results;
}

// Fetch a single requestor (without workers)
export async function fetchRequestor(
  requestorId: string
): Promise<Requestor | null> {
  const requestors = getMachinesByType("requestor");
  const requestorConfig = requestors.find((r) => r.id === requestorId);
  if (!requestorConfig) {
    return null;
  }

  try {
    const response = await fetch(requestorConfig.apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch requestor status`);
    }
    const data: SystemStatus = await response.json();
    const summary = calculateRequestorSummary(data);

    return {
      requestor_id: requestorConfig.id,
      name: requestorConfig.name,
      reported_at: data.timestamp,
      summary,
      isOnline: true,
    };
  } catch (error) {
    console.error(`Failed to fetch requestor ${requestorId}:`, error);
    return {
      requestor_id: requestorConfig.id,
      name: requestorConfig.name,
      reported_at: new Date().toISOString(),
      summary: createOfflineSummary(),
      isOnline: false,
    };
  }
}
