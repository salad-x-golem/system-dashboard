import { HashRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { MachineDetailPage, MachinesPage } from "@/features/machines";
import { OverviewPage } from "@/features/overview";

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/machines" element={<MachinesPage />} />
            <Route
              path="/machines/:machineId"
              element={<MachineDetailPage />}
            />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
