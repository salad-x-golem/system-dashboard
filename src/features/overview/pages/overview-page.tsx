import { AlertTriangle, CheckCircle, RefreshCw, Server } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingCard } from "@/components/ui/loading-state";
import { useMachines } from "@/features/machines";
import { StatCard } from "../components/stat-card";

export function OverviewPage() {
  const {
    data: machines,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useMachines();

  const stats = useMemo(() => {
    if (!machines) return null;

    const totalMachines = machines.length;
    let totalProviders = 0;
    let workingProviders = 0;
    let staleProviders = 0;
    let unknownProviders = 0;

    for (const machine of machines) {
      totalProviders += machine.summary.total;
      workingProviders += machine.summary.working;
      staleProviders += machine.summary.stale;
      unknownProviders += machine.summary.unknown;
    }

    const overallHealthPercent =
      totalProviders > 0
        ? Math.round((workingProviders / totalProviders) * 1000) / 10
        : 0;

    // Machines with issues (health < 80%)
    const machinesWithIssues = machines
      .filter((m) => m.summary.working_percent < 80)
      .sort((a, b) => a.summary.working_percent - b.summary.working_percent)
      .slice(0, 10);

    // Group by location
    const locationCounts = machines.reduce((acc, m) => {
      acc[m.location] = (acc[m.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationStats = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMachines,
      totalProviders,
      workingProviders,
      staleProviders,
      unknownProviders,
      overallHealthPercent,
      machinesWithIssues,
      locationStats,
    };
  }, [machines]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        Error loading data: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">System health at a glance</p>
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Machines"
              value={stats.totalMachines}
              icon={<Server className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="System Health"
              value={`${stats.overallHealthPercent}%`}
              subtitle={`${
                stats.staleProviders + stats.unknownProviders
              } providers with issues`}
              variant={
                stats.overallHealthPercent >= 80
                  ? "success"
                  : stats.overallHealthPercent >= 50
                  ? "warning"
                  : "danger"
              }
              icon={
                stats.overallHealthPercent >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )
              }
            />
            <StatCard
              title="Total Providers"
              value={stats.totalProviders.toLocaleString()}
              subtitle={`${stats.workingProviders.toLocaleString()} working`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Machines Needing Attention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Machines Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.machinesWithIssues.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All machines are healthy
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.machinesWithIssues.map((machine) => (
                      <Link
                        key={machine.machine_id}
                        to={`/machines/${machine.machine_id}`}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                      >
                        <div>
                          <p className="font-medium">{machine.hostname}</p>
                          <p className="text-xs text-muted-foreground">
                            {machine.location}
                          </p>
                        </div>
                        <Badge
                          variant={
                            machine.summary.working_percent >= 50
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {machine.summary.working_percent}%
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribution by Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Machines by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.locationStats.map(({ location, count }) => (
                    <div key={location} className="flex items-center gap-3">
                      <div className="w-24 shrink-0">
                        <Badge variant="outline">{location}</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${(count / stats.totalMachines) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
