// src/components/layout/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Car, 
  History, 
  BarChart3, 
  UserRound, 
  ParkingSquare,
  Users,
  LogOut,
  Clock,
  Settings,
  Tv,
  Database,
  ChevronDown,
  Calendar,
  Download,      // 👈 Para Backup
  Upload         // 👈 Para Restaurar
} from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/vehicles", icon: Car, label: "Vehículos dentro" },
  { path: "/history", icon: History, label: "Historial" },
  { path: "/reports", icon: BarChart3, label: "Reportes" },
  { path: "/doctors", icon: UserRound, label: "Médicos" },
  { path: "/parking", icon: ParkingSquare, label: "Parking Virtual" },
  { path: "/parking-history", icon: History, label: "Historial Estacionamiento" },
  { path: "/reservas", icon: Calendar, label: "Reservas", adminOnly: true },
];

const adminItems = [
  { path: "/users", icon: Users, label: "Usuarios" },
  { path: "/backup", icon: Download, label: "Backup" },      // 👈 Agregado
  { path: "/restore", icon: Upload, label: "Restaurar" },    // 👈 Agregado
  { path: "/tv", icon: Tv, label: "Modo TV" },
  { path: "/logs", icon: Database, label: "Logs" },
];

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [systemOpen, setSystemOpen] = useState(true); // Cambiado a true para que se vea el menú Sistema

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsAdmin(parsed?.rol === "Admin");
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800 flex justify-center">
        <div className="logo-universal">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        </div>
      </div>

      {/* Info usuario */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800">
        <p className="text-xs font-semibold text-amber-500 mb-3">Capacidad total: 37 plazas</p>
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Rol: <span className="text-white">{user?.rol || "Admin"}</span></p>
          <p className="text-sm text-slate-400">Bienvenido, <span className="text-white">{user?.nombre || "Administrador"}</span></p>
          <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Sesión activa</p>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => {
          // Si el item es solo para admin y el usuario no es admin, lo omitimos
          if (item.adminOnly && !isAdmin) return null;
          
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="border-t border-slate-800 my-2" />
            
            <button
              onClick={() => setSystemOpen(!systemOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Sistema</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${systemOpen ? 'rotate-180' : ''}`} />
            </button>

            {systemOpen && (
              <div className="ml-6 space-y-1">
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose?.()}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}