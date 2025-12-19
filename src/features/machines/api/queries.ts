import { queryOptions } from "@tanstack/react-query";
import {
  fetchAllMachines,
  fetchMachine,
  fetchMachineProviders,
  fetchMachineWithProviders,
  fetchProviderDetails,
} from "@/data/api";

export const machineKeys = {
  all: ["machines"] as const,
  lists: () => [...machineKeys.all, "list"] as const,
  list: () => [...machineKeys.lists()] as const,
  details: () => [...machineKeys.all, "detail"] as const,
  detail: (id: string) => [...machineKeys.details(), id] as const,
  providers: (id: string) => [...machineKeys.detail(id), "providers"] as const,
  providerDetail: (machineId: string, providerId: string) =>
    [...machineKeys.providers(machineId), providerId] as const,
  withProviders: (id: string) => [...machineKeys.detail(id), "full"] as const,
};

export const machinesQueryOptions = () =>
  queryOptions({
    queryKey: machineKeys.list(),
    queryFn: () => fetchAllMachines(),
    staleTime: 30_000, // 30 seconds
  });

export const machineQueryOptions = (machineId: string) =>
  queryOptions({
    queryKey: machineKeys.detail(machineId),
    queryFn: async () => {
      const machine = await fetchMachine(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
      }
      return machine;
    },
    staleTime: 30_000,
  });

export const machineProvidersQueryOptions = (machineId: string) =>
  queryOptions({
    queryKey: machineKeys.providers(machineId),
    queryFn: () => fetchMachineProviders(machineId),
    staleTime: 30_000,
  });

export const machineWithProvidersQueryOptions = (machineId: string) =>
  queryOptions({
    queryKey: machineKeys.withProviders(machineId),
    queryFn: async () => {
      const machine = await fetchMachineWithProviders(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found`);
      }
      return machine;
    },
    staleTime: 30_000,
  });

export const providerDetailsQueryOptions = (
  machineId: string,
  providerId: string
) =>
  queryOptions({
    queryKey: machineKeys.providerDetail(machineId, providerId),
    queryFn: async () => {
      const provider = await fetchProviderDetails(machineId, providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }
      return provider;
    },
    staleTime: 30_000,
  });
