import { queryOptions } from "@tanstack/react-query";
import {
  fetchAllRequestors,
  fetchRequestor,
  fetchRequestorStatus,
} from "@/data/requestor-api";

export const requestorKeys = {
  all: ["requestors"] as const,
  lists: () => [...requestorKeys.all, "list"] as const,
  list: () => [...requestorKeys.lists()] as const,
  details: () => [...requestorKeys.all, "detail"] as const,
  detail: (id: string) => [...requestorKeys.details(), id] as const,
  withWorkers: (id: string) => [...requestorKeys.detail(id), "full"] as const,
};

export const requestorsQueryOptions = () =>
  queryOptions({
    queryKey: requestorKeys.list(),
    queryFn: () => fetchAllRequestors(),
    staleTime: 30_000, // 30 seconds
  });

export const requestorQueryOptions = (requestorId: string) =>
  queryOptions({
    queryKey: requestorKeys.detail(requestorId),
    queryFn: async () => {
      const requestor = await fetchRequestor(requestorId);
      if (!requestor) {
        throw new Error(`Requestor ${requestorId} not found`);
      }
      return requestor;
    },
    staleTime: 30_000,
  });

export const requestorWithWorkersQueryOptions = (requestorId: string) =>
  queryOptions({
    queryKey: requestorKeys.withWorkers(requestorId),
    queryFn: async () => {
      const requestor = await fetchRequestorStatus(requestorId);
      if (!requestor) {
        throw new Error(`Requestor ${requestorId} not found`);
      }
      return requestor;
    },
    staleTime: 30_000,
  });
