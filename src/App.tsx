import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DemoProvider } from "./context/DemoContext";
import { Home } from "./pages/Home";
import { ExecutiveDemo } from "./pages/ExecutiveDemo";
import { LiveDemo } from "./pages/LiveDemo";
import { Setup } from "./pages/Setup";
import { BusinessProfile } from "./pages/BusinessProfile";
import { Appointments } from "./pages/Appointments";
import { CallHistory } from "./pages/CallHistory";
import { CallDetail } from "./pages/CallDetail";
import { HowItWorks } from "./pages/HowItWorks";
import { Privacy } from "./pages/Privacy";
import { Architecture } from "./pages/Architecture";
import { About } from "./pages/About";

export default function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/executive-demo" element={<ExecutiveDemo />} />
            <Route path="/live-demo" element={<LiveDemo />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/business-profile" element={<BusinessProfile />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/history" element={<CallHistory />} />
            <Route path="/history/:id" element={<CallDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </DemoProvider>
  );
}
