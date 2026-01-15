import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clipboard,
  RefreshCw,
  Server,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AddMachineDialog } from "@/components/add-machine-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Column, DataTable } from "@/components/ui/data-table";
import { LoadingCard, LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { type Machine, useMachines } from "@/features/machines";
import { type Requestor, useRequestors } from "@/features/requestors";
import { useTableState } from "@/hooks";
import {
  getMachines,
  removeMachine,
  STORAGE_KEY,
} from "@/lib/machines-storage";

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    data: machines,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useMachines();

  const {
    data: requestors,
    isLoading: requestorsLoading,
    error: requestorsError,
    refetch: refetchRequestors,
    isFetching: isFetchingRequestors,
  } = useRequestors();

  const handleRemoveMachine = useCallback(
    (e: React.MouseEvent, machineId: string) => {
      e.stopPropagation();
      removeMachine(machineId);
      refetch();
    },
    [refetch]
  );

  const handleRemoveRequestor = useCallback(
    (e: React.MouseEvent, requestorId: string) => {
      e.stopPropagation();
      removeMachine(requestorId);
      refetchRequestors();
    },
    [refetchRequestors]
  );

  const handleRefreshAll = useCallback(() => {
    refetch();
    refetchRequestors();
  }, [refetch, refetchRequestors]);

  const isAnyFetching = isFetching || isFetchingRequestors;

  const stats = useMemo(() => {
    if (!machines && !requestors) return null;

    // Provider stats
    const totalMachines = machines?.length ?? 0;
    let totalProviders = 0;
    let workingProviders = 0;
    let waitingProviders = 0;
    let unknownProviders = 0;

    for (const machine of machines ?? []) {
      totalProviders += machine.summary.total;
      workingProviders += machine.summary.working;
      waitingProviders += machine.summary.waiting;
      unknownProviders += machine.summary.unknown;
    }

    const providerHealthPercent =
      totalProviders > 0
        ? Math.round((workingProviders / totalProviders) * 1000) / 10
        : 0;

    // Requestor stats
    const totalRequestors = requestors?.length ?? 0;
    const onlineRequestors = requestors?.filter((r) => r.isOnline).length ?? 0;
    const offlineRequestors = totalRequestors - onlineRequestors;
    let totalWorkers = 0;
    let activeWorkers = 0;
    let idleWorkers = 0;
    let errorWorkers = 0;
    let totalSuccessfulIterations = 0;
    let totalFailedIterations = 0;

    for (const requestor of requestors ?? []) {
      totalWorkers += requestor.summary.totalWorkers;
      activeWorkers += requestor.summary.activeWorkers;
      idleWorkers += requestor.summary.idleWorkers;
      errorWorkers += requestor.summary.errorWorkers;
      totalSuccessfulIterations += requestor.summary.totalSuccessfulIterations;
      totalFailedIterations += requestor.summary.totalFailedIterations;
    }

    const requestorHealthPercent =
      totalWorkers > 0
        ? Math.round((activeWorkers / totalWorkers) * 1000) / 10
        : 0;

    return {
      totalMachines,
      totalProviders,
      workingProviders,
      waitingProviders,
      unknownProviders,
      providerHealthPercent,
      totalRequestors,
      onlineRequestors,
      offlineRequestors,
      totalWorkers,
      activeWorkers,
      idleWorkers,
      errorWorkers,
      requestorHealthPercent,
      totalSuccessfulIterations,
      totalFailedIterations,
    };
  }, [machines, requestors]);

  const columns: Column<Machine>[] = [
    {
      key: "hostname",
      header: "Name",
      sortable: true,
      render: (machine) => (
        <span className="font-medium">{machine.hostname}</span>
      ),
    },
    {
      key: "summary.total",
      header: "Providers",
      sortable: true,
      render: (machine) => machine.summary.total,
      className: "text-right",
    },
    {
      key: "summary.working_percent",
      header: "Health",
      sortable: true,
      render: (machine) => {
        const percent = machine.summary.working_percent;
        const variant =
          percent >= 80
            ? "default"
            : percent >= 50
            ? "secondary"
            : "destructive";
        return <Badge variant={variant}>{percent}%</Badge>;
      },
      className: "text-right",
    },
    {
      key: "summary.working",
      header: "Working",
      sortable: true,
      render: (machine) => (
        <span className="text-green-600 dark:text-green-400">
          {machine.summary.working}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "summary.waiting",
      header: "Waiting",
      sortable: true,
      render: (machine) => (
        <span className="text-yellow-600 dark:text-yellow-400">
          {machine.summary.waiting}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "summary.unknown",
      header: "Unknown",
      sortable: true,
      render: (machine) => (
        <span className="text-red-600 dark:text-red-400">
          {machine.summary.unknown}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (machine) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleRemoveMachine(e, machine.machine_id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      className: "w-12",
    },
  ];

  const requestorColumns: Column<Requestor>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (requestor) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{requestor.name}</span>
          {!requestor.isOnline && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <XCircle className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "summary.totalWorkers",
      header: "Workers",
      sortable: true,
      render: (requestor) => requestor.summary.totalWorkers,
      className: "text-right",
    },
    {
      key: "summary.healthPercent",
      header: "Health",
      sortable: true,
      render: (requestor) => {
        if (!requestor.isOnline) {
          return <Badge variant="destructive">Offline</Badge>;
        }
        const percent = requestor.summary.healthPercent;
        const variant =
          percent >= 80
            ? "default"
            : percent >= 50
            ? "secondary"
            : "destructive";
        return <Badge variant={variant}>{percent}%</Badge>;
      },
      className: "text-right",
    },
    {
      key: "summary.activeWorkers",
      header: "Active",
      sortable: true,
      render: (requestor) => (
        <span className="text-green-600 dark:text-green-400">
          {requestor.summary.activeWorkers}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "summary.idleWorkers",
      header: "Idle",
      sortable: true,
      render: (requestor) => (
        <span className="text-yellow-600 dark:text-yellow-400">
          {requestor.summary.idleWorkers}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "summary.errorWorkers",
      header: "Error",
      sortable: true,
      render: (requestor) => (
        <span className="text-red-600 dark:text-red-400">
          {requestor.summary.errorWorkers}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "summary.totalSuccessfulIterations",
      header: "Successful",
      sortable: true,
      render: (requestor) => (
        <span className="text-green-600 dark:text-green-400">
          {requestor.summary.totalSuccessfulIterations.toLocaleString()}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "summary.totalFailedIterations",
      header: "Failed",
      sortable: true,
      render: (requestor) => (
        <span className="text-red-600 dark:text-red-400">
          {requestor.summary.totalFailedIterations.toLocaleString()}
        </span>
      ),
      className: "text-right",
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (requestor) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handleRemoveRequestor(e, requestor.requestor_id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      className: "w-12",
    },
  ];

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
    data: machines,
    searchFields: ["machine_id", "hostname"] as const,
    pageSize: 20,
  });

  const {
    search: requestorSearch,
    setSearch: setRequestorSearch,
    sort: requestorSort,
    handleSort: handleRequestorSort,
    currentPage: requestorCurrentPage,
    setCurrentPage: setRequestorCurrentPage,
    totalPages: requestorTotalPages,
    paginatedData: requestorPaginatedData,
    filteredCount: requestorFilteredCount,
  } = useTableState({
    data: requestors,
    searchFields: ["requestor_id", "name"] as const,
    pageSize: 20,
  });

  if (error && requestorsError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Error loading data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Server className="h-6 w-6" />
            <h1 className="text-xl font-bold">System Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <AddMachineDialog onMachineAdded={handleRefreshAll} />
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              disabled={isAnyFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  isAnyFetching ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const machines = getMachines();
                const command = `localStorage.setItem(${JSON.stringify(
                  STORAGE_KEY
                )}, ${JSON.stringify(JSON.stringify(machines))})`;
                navigator.clipboard.writeText(command);
              }}
              title="Copy config to clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Stats Cards */}
        {isLoading && requestorsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Providers Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Providers</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalProviders.toLocaleString()}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    {stats.workingProviders} working
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {stats.waitingProviders} waiting
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    {stats.unknownProviders} unknown
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  across {stats.totalMachines} machine
                  {stats.totalMachines !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            {/* Provider Health Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Provider Health
                </CardTitle>
                {stats.providerHealthPercent >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.providerHealthPercent}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.waitingProviders + stats.unknownProviders} with issues
                </p>
              </CardContent>
            </Card>

            {/* Requestors Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Requestors
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalWorkers.toLocaleString()} workers
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    {stats.activeWorkers} active
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {stats.idleWorkers} idle
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    {stats.errorWorkers} error
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.onlineRequestors}/{stats.totalRequestors} online
                </p>
              </CardContent>
            </Card>

            {/* Iterations Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Iterations
                </CardTitle>
                {stats.requestorHealthPercent >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : stats.totalWorkers > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.totalSuccessfulIterations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  successful iterations
                </p>
                {stats.totalFailedIterations > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {stats.totalFailedIterations.toLocaleString()} failed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Providers Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Providers</h2>
          <div className="flex items-center justify-between gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search providers..."
              className="w-80"
            />
            <div className="text-sm text-muted-foreground">
              {filteredCount} provider{filteredCount !== 1 ? "s" : ""}
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
                onRowClick={(machine) =>
                  navigate(`/machines/${machine.machine_id}`)
                }
                rowKey={(machine) => machine.machine_id}
                emptyMessage="No providers configured. Click 'Add Machine' and select 'Provider' type."
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

        {/* Requestors Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Requestors</h2>
          <div className="flex items-center justify-between gap-4">
            <SearchInput
              value={requestorSearch}
              onChange={setRequestorSearch}
              placeholder="Search requestors..."
              className="w-80"
            />
            <div className="text-sm text-muted-foreground">
              {requestorFilteredCount} requestor
              {requestorFilteredCount !== 1 ? "s" : ""}
            </div>
          </div>

          {requestorsLoading ? (
            <LoadingState rows={5} />
          ) : (
            <>
              <DataTable
                data={requestorPaginatedData}
                columns={requestorColumns}
                sort={requestorSort}
                onSort={handleRequestorSort}
                onRowClick={(requestor) =>
                  navigate(`/requestors/${requestor.requestor_id}`)
                }
                rowKey={(requestor) => requestor.requestor_id}
                emptyMessage="No requestors configured. Click 'Add Machine' and select 'Requestor' type."
              />

              {requestorTotalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination
                    currentPage={requestorCurrentPage}
                    totalPages={requestorTotalPages}
                    onPageChange={setRequestorCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
