import { HashRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { MachineDetailPage } from "@/features/machines";
import { DashboardPage } from "@/pages/dashboard-page";

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/machines/:machineId" element={<MachineDetailPage />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
