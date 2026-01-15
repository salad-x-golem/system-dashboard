import { useQuery } from "@tanstack/react-query";
import {
  requestorQueryOptions,
  requestorsQueryOptions,
  requestorWithWorkersQueryOptions,
} from "../api/queries";

/**
 * Hook to fetch all requestors (without workers)
 */
export function useRequestors() {
  return useQuery(requestorsQueryOptions());
}

/**
 * Hook to fetch a single requestor by ID
 */
export function useRequestor(requestorId: string) {
  return useQuery({
    ...requestorQueryOptions(requestorId),
    enabled: !!requestorId,
  });
}

/**
 * Hook to fetch a requestor with all its workers
 */
export function useRequestorWithWorkers(requestorId: string) {
  return useQuery({
    ...requestorWithWorkersQueryOptions(requestorId),
    enabled: !!requestorId,
  });
}
