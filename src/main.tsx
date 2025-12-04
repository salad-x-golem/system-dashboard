import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";

const queryClient = new QueryClient();

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "failed") {
    const query = event.query;
    const error = event.action.error;

    console.groupCollapsed(`🛑 Query Failed (${query.queryHash})`);
    console.log("Error:", error);
    console.log("Query Key:", query.queryKey);
    console.log("Failure Count:", query.state.fetchFailureCount);
    console.groupEnd();
  }
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
