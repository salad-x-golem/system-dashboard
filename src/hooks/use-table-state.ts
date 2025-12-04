import { useCallback, useMemo, useState } from "react";
import type { SortState } from "@/components/ui/data-table";

interface UseTableStateOptions<T> {
  data: T[] | undefined;
  searchFields: (keyof T)[];
  pageSize?: number;
}

interface TableState<T> {
  search: string;
  setSearch: (value: string) => void;
  sort: SortState;
  handleSort: (column: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  paginatedData: T[];
  filteredCount: number;
}

// Helper to get nested property value using dot notation (e.g., "summary.total")
function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function useTableState<T>({
  data,
  searchFields,
  pageSize = 20,
}: UseTableStateOptions<T>): TableState<T> {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when search changes
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSort((prev) => {
      // If clicking a different column, start with ascending
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      // Cycle through: asc -> desc -> null (reset)
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { column: null, direction: null };
      }
      return { column, direction: "asc" };
    });
  }, []);

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // Filter by search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowerSearch);
          }
          if (typeof value === "number") {
            return value.toString().includes(lowerSearch);
          }
          return false;
        })
      );
    }

    // Sort - supports nested properties like "summary.total"
    if (sort.column && sort.direction) {
      result.sort((a, b) => {
        const aVal = getNestedValue(a, sort.column as string);
        const bVal = getNestedValue(b, sort.column as string);

        let comparison = 0;
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        }

        return sort.direction === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [data, search, sort, searchFields]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  return {
    search,
    setSearch: handleSearch,
    sort,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    filteredCount: filteredAndSortedData.length,
  };
}
