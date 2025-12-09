import { AlertTriangle, CheckCircle, RefreshCw, Server, Trash2 } from "lucide-react";
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
import { useTableState } from "@/hooks";
import { removeMachine } from "@/lib/machines-storage";

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    data: machines,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useMachines();

  const handleRemoveMachine = useCallback(
    (e: React.MouseEvent, machineId: string) => {
      e.stopPropagation();
      removeMachine(machineId);
      refetch();
    },
    [refetch]
  );

  const stats = useMemo(() => {
    if (!machines) return null;

    const totalMachines = machines.length;
    let totalProviders = 0;
    let workingProviders = 0;
    let waitingProviders = 0;
    let unknownProviders = 0;

    for (const machine of machines) {
      totalProviders += machine.summary.total;
      workingProviders += machine.summary.working;
      waitingProviders += machine.summary.waiting;
      unknownProviders += machine.summary.unknown;
    }

    const overallHealthPercent =
      totalProviders > 0
        ? Math.round((workingProviders / totalProviders) * 1000) / 10
        : 0;

    return {
      totalMachines,
      totalProviders,
      workingProviders,
      waitingProviders,
      unknownProviders,
      overallHealthPercent,
    };
  }, [machines]);

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

  if (error) {
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
            <AddMachineDialog onMachineAdded={() => refetch()} />
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Machines</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMachines}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                {stats.overallHealthPercent >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overallHealthPercent}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.waitingProviders + stats.unknownProviders} providers
                  with issues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Providers
                </CardTitle>
              </CardHeader>
                  <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalProviders.toLocaleString()} total
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-green-600 dark:text-green-400">Working:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {stats.workingProviders.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">Waiting:</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      {stats.waitingProviders.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-red-600 dark:text-red-400">Unknown:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {stats.unknownProviders.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Machines Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search machines..."
              className="w-80"
            />
            <div className="text-sm text-muted-foreground">
              {filteredCount} machine{filteredCount !== 1 ? "s" : ""}
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
                emptyMessage="No machines configured. Click 'Add Machine' to get started."
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
      </main>
    </div>
  );
}
