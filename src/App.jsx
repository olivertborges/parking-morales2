// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ActiveVehiclesPage from "./pages/vehicles/ActiveVehiclesPage";
import HistoryPage from "./pages/history/HistoryPage";
import ReportsPage from "./pages/reports/ReportsPage";
import DoctorsPage from "./pages/doctors/DoctorsPage";
import ParkingPage from "./pages/parking/ParkingPage";
import ParkingHistoryPage from "./pages/parking/ParkingHistoryPage";
import UsersPage from "./pages/users/UsersPage";
import Layout from "./components/layout/Layout";
import LogsPage from "./pages/logs/LogsPage";
import TVPage from "./pages/tv/TVPage";
import { scheduleAutoBackup } from "./services/autoBackupService";

function App() {
  useEffect(() => {
    scheduleAutoBackup();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<ActiveVehiclesPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="parking-history" element={<ParkingHistoryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="tv" element={<TVPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;