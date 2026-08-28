import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { Sidebar } from "@/components/Sidebar";
import Overview from "@/pages/Overview";
import LiveMap from "@/pages/LiveMap";
import ZoneDetail from "@/pages/ZoneDetail";
import AlertsCenter from "@/pages/AlertsCenter";
import SimulationControl from "@/pages/SimulationControl";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/zones/:zoneId" element={<ZoneDetail />} />
            <Route path="/alerts" element={<AlertsCenter />} />
            <Route path="/simulation" element={<SimulationControl />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
