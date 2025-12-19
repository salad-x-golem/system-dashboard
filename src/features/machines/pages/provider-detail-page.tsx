import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingCard } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMachine, useProviderDetails } from "@/features/machines";

function BoolIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={value ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

export function ProviderDetailPage() {
  const { machineId, providerId } = useParams<{
    machineId: string;
    providerId: string;
  }>();

  const { data: machine, isLoading: machineLoading } = useMachine(
    machineId ?? ""
  );

  const {
    data: provider,
    isLoading: providerLoading,
    error: providerError,
    refetch,
    isFetching,
  } = useProviderDetails(machineId ?? "", providerId ?? "");

  const isLoading = machineLoading || providerLoading;

  if (providerError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Link to={`/machines/${machineId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Machine
          </Button>
        </Link>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Error loading provider: {providerError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/machines/${machineId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoading ? "Loading..." : provider?.name ?? providerId}
              </h1>
              <p className="font-mono text-muted-foreground">
                {isLoading ? "" : machine?.hostname ?? machineId}
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

        {/* Provider Info Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : provider ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Status Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={provider.status} />
                    {provider.latency_ms !== null && (
                      <span className="text-sm text-muted-foreground">
                        {provider.latency_ms}ms latency
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last seen: {formatTimestamp(provider.last_seen)}
                  </p>
                </CardContent>
              </Card>

              {/* Services Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <BoolIndicator
                    value={provider.yagna_running}
                    label={`Yagna (${provider.yagna_service})`}
                  />
                  <BoolIndicator
                    value={provider.provider_running}
                    label={`Provider (${provider.provider_service})`}
                  />
                </CardContent>
              </Card>

              {/* PIDs Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Process IDs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Yagna: </span>
                    <span className="font-mono">
                      {provider.yagna_pids.join(", ") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider: </span>
                    <span className="font-mono">
                      {provider.provider_pids.join(", ") || "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logs Section */}
            {provider.workDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={provider.workDetails.provider_log_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Provider Log
                      </Button>
                    </a>
                    <a
                      href={provider.workDetails.yagna_log_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Yagna Log
                      </Button>
                    </a>
                    <a
                      href={provider.workDetails.offer_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Offer
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agreements Section */}
            {provider.workDetails &&
              provider.workDetails.agreements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Recent Agreements (
                      {provider.workDetails.agreements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {provider.workDetails.agreements.map((agreement) => (
                        <div
                          key={agreement.agreement_id}
                          className="rounded-lg border p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  Requestor:
                                </span>
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                  {agreement.requestor_id}
                                </code>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  Agreement:
                                </span>
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                  {agreement.agreement_id.slice(0, 16)}...
                                </code>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {formatRelativeTime(agreement.timestamp)}
                            </div>
                          </div>

                          {/* Last log line */}
                          <div className="mb-3 rounded bg-muted/50 p-2">
                            <p className="break-all font-mono text-xs text-muted-foreground">
                              {agreement.last_line}
                            </p>
                          </div>

                          <a
                            href={agreement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              Full Log
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* No work details message */}
            {!provider.workDetails && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No work details available for this provider.
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
