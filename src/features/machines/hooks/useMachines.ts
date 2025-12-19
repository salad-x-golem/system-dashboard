import { useQuery } from "@tanstack/react-query";
import {
  machineProvidersQueryOptions,
  machineQueryOptions,
  machinesQueryOptions,
  machineWithProvidersQueryOptions,
  providerDetailsQueryOptions,
} from "../api/queries";

/**
 * Hook to fetch all machines (without providers)
 */
export function useMachines() {
  return useQuery(machinesQueryOptions());
}

/**
 * Hook to fetch a single machine by ID
 */
export function useMachine(machineId: string) {
  return useQuery({
    ...machineQueryOptions(machineId),
    enabled: !!machineId,
  });
}

/**
 * Hook to fetch providers for a specific machine
 */
export function useMachineProviders(machineId: string) {
  return useQuery({
    ...machineProvidersQueryOptions(machineId),
    enabled: !!machineId,
  });
}

/**
 * Hook to fetch a machine with all its providers
 */
export function useMachineWithProviders(machineId: string) {
  return useQuery({
    ...machineWithProvidersQueryOptions(machineId),
    enabled: !!machineId,
  });
}

/**
 * Hook to fetch detailed info for a single provider
 */
export function useProviderDetails(machineId: string, providerId: string) {
  return useQuery({
    ...providerDetailsQueryOptions(machineId, providerId),
    enabled: !!machineId && !!providerId,
  });
}
