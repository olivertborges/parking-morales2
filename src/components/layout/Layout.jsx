// src/components/layout/Layout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { Menu, Car, TrendingUp, Bell, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "../../services/supabase";

export default function Layout() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    dentro: 0,
    capacidad: 37,
    porcentaje: 0,
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {}
    }

    cargarStats();
    const interval = setInterval(cargarStats, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  async function cargarStats() {
    const { data } = await supabase
      .from("active_vehicles")
      .select("*", { count: "exact" });
    const dentro = data?.length || 0;
    const capacidad = 37;
    const porcentaje = Math.round((dentro / capacidad) * 100);
    setStats({ dentro, capacidad, porcentaje });
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("es-AR", { hour12: false });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAlerta = () => {
    if (stats.porcentaje >= 90)
      return {
        text: "Ocupación crítica",
        color: "text-red-400",
        bg: "bg-red-500/20",
      };
    if (stats.porcentaje >= 70)
      return {
        text: "Alta demanda",
        color: "text-orange-400",
        bg: "bg-orange-500/20",
      };
    return { text: "Normal", color: "text-green-400", bg: "bg-green-500/20" };
  };

  const alerta = getAlerta();

  // Cerrar sidebar al hacer clic fuera
  const handleOverlayClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
      {/* Overlay para cerrar sidebar al hacer clic fuera */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
                                                                                                                                                                                                                                                                                        fixed lg:relative z-50 transition-transform duration-300 ease-in-out
                                                                                                                                                                                                                                                                                                ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                                                                                                                                                                                                                                                                                                      `}
      >
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-slate-800 text-white"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:hidden">
              <div className="logo-universal-mobile">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" style={{ filter: "none" }} />
              </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">
                    Parking Morales
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Sistema Profesional
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4 ml-2">
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1.5">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span className="text-white text-sm font-semibold">
                    {stats.dentro}
                  </span>
                  <span className="text-slate-400 text-xs">
                    /{stats.capacidad}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-white text-sm font-semibold">
                    {stats.porcentaje}%
                  </span>
                  <span className="text-slate-400 text-xs">ocupación</span>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${alerta.bg}`}
                >
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span className={`text-xs font-medium ${alerta.color}`}>
                    {alerta.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Info del usuario */}
              <div className="hidden md:flex items-center gap-3 bg-slate-800/50 rounded-full px-4 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{user?.nombre || "Usuario"}</p>
                  <p className="text-xs text-amber-400">Rol: {user?.rol || "Admin"}</p>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl px-3 py-1.5">
                <div className="clock-time flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400 hidden sm:block" />
                  <span className="text-white font-mono text-sm font-semibold">
                    {formatTime(currentTime)}
                  </span>
                </div>
                <div className="clock-date text-[10px] text-slate-400 text-right hidden md:block">
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 md:hidden">
            <div className="flex justify-between text-xs text-slate-400 mb-0.5">
              <span>Ocupación</span>
              <span>
                {stats.dentro}/{stats.capacidad} ({stats.porcentaje}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.porcentaje}%` }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
