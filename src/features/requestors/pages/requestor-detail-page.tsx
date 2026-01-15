import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Column, DataTable } from "@/components/ui/data-table";
import { LoadingCard, LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchInput } from "@/components/ui/search-input";
import type { WorkerState, WorkerStatus } from "@/data/requestor-api";
import { useTableState } from "@/hooks";
import { useRequestorWithWorkers } from "../hooks/useRequestors";

function WorkerStateBadge({ state }: { state: WorkerState }) {
  const variants: Record<
    WorkerState,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    idle: { variant: "secondary", label: "Idle" },
    waiting_for_rental: { variant: "outline", label: "Waiting for Rental" },
    initializing_estimator: { variant: "outline", label: "Initializing" },
    running_command: { variant: "default", label: "Running" },
    processing_results: { variant: "default", label: "Processing" },
    releasing_rental: { variant: "outline", label: "Releasing" },
    destroying_rental: { variant: "outline", label: "Destroying" },
    error: { variant: "destructive", label: "Error" },
    stopped: { variant: "secondary", label: "Stopped" },
  };

  const { variant, label } = variants[state] || {
    variant: "outline",
    label: state,
  };
  return <Badge variant={variant}>{label}</Badge>;
}

const columns: Column<WorkerStatus>[] = [
  {
    key: "workerNo",
    header: "Worker #",
    sortable: true,
    render: (worker) => (
      <span className="font-mono text-sm">{worker.workerNo}</span>
    ),
  },
  {
    key: "state",
    header: "State",
    sortable: true,
    render: (worker) => <WorkerStateBadge state={worker.state} />,
  },
  {
    key: "currentProvider",
    header: "Current Provider",
    sortable: true,
    render: (worker) => {
      const hasActiveRental =
        worker.currentProviderId || worker.currentAgreementId;
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{worker.currentProvider || "—"}</span>
          {hasActiveRental && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded p-0.5 hover:bg-muted cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-sm" align="start">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Active Rental Details
                  </p>
                  {worker.currentProviderId && (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Provider ID
                        </p>
                        <p className="font-mono text-xs break-all">
                          {worker.currentProviderId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            worker.currentProviderId!
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {worker.currentAgreementId && (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Agreement ID
                        </p>
                        <p className="font-mono text-xs break-all">
                          {worker.currentAgreementId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            worker.currentAgreementId!
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    },
  },
  {
    key: "successfulIterations",
    header: "Success",
    sortable: true,
    render: (worker) => (
      <span className="text-green-600 dark:text-green-400">
        {worker.successfulIterations}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "failedIterations",
    header: "Failed",
    sortable: true,
    render: (worker) => (
      <span className="text-red-600 dark:text-red-400">
        {worker.failedIterations}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "currentIterationNo",
    header: "Current Iteration",
    sortable: true,
    render: (worker) => worker.currentIterationNo ?? "—",
    className: "text-right",
  },
  {
    key: "lastUpdateTimestamp",
    header: "Last Update",
    sortable: true,
    render: (worker) => {
      if (!worker.lastUpdateTimestamp) return "Never";
      const date = new Date(worker.lastUpdateTimestamp);
      return date.toLocaleString();
    },
  },
  {
    key: "lastError",
    header: "Last Error",
    sortable: false,
    render: (worker) =>
      worker.lastError ? (
        <span className="text-xs text-red-600 dark:text-red-400 line-clamp-1">
          {worker.lastError}
        </span>
      ) : (
        "—"
      ),
  },
];

export function RequestorDetailPage() {
  const { requestorId } = useParams<{ requestorId: string }>();
  const {
    data: requestor,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useRequestorWithWorkers(requestorId ?? "");

  const {
    search,
    setSearch,
    sort,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    filteredCount,
  } = useTableState({
    data: requestor?.workers,
    searchFields: ["state", "currentProvider"] as const,
    pageSize: 20,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Error loading requestor: {error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isLoading ? "Loading..." : requestor?.name}
                </h1>
                {requestor && !requestor.isOnline && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
              </div>
              <p className="font-mono text-muted-foreground">
                {isLoading ? "" : requestor?.requestor_id}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Requestor Info Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : requestor ? (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                {requestor.isOnline ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requestor.isOnline ? "Online" : "Offline"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {requestor.summary.totalWorkers} total workers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requestor.summary.healthPercent}% Health
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Active: {requestor.summary.activeWorkers}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      Idle: {requestor.summary.idleWorkers}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-red-600 dark:text-red-400">
                      Error: {requestor.summary.errorWorkers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Iterations
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requestor.summary.totalSuccessfulIterations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  successful iterations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failures</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {requestor.summary.totalFailedIterations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  failed iterations
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Workers Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search workers..."
              className="w-80"
            />
            <div className="text-sm text-muted-foreground">
              {filteredCount} worker{filteredCount !== 1 ? "s" : ""}
            </div>
          </div>

          {isLoading ? (
            <LoadingState rows={5} />
          ) : (
            <>
              <DataTable
                data={paginatedData}
                columns={columns}
                sort={sort}
                onSort={handleSort}
                rowKey={(worker) => String(worker.workerNo)}
                emptyMessage={
                  requestor?.isOnline
                    ? "No workers found."
                    : "Requestor is offline. Unable to fetch worker data."
                }
              />

              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
