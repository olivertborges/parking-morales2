import {
  LayoutDashboard,
  Car,
  History,
  BarChart3,
  UserRound,
  ParkingCircle,
  Users,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Vehículos dentro",
    icon: Car,
    path: "/vehiculos",
  },
  {
    label: "Historial",
    icon: History,
    path: "/historial",
  },
  {
    label: "Reportes",
    icon: BarChart3,
    path: "/reportes",
  },
  {
    label: "Médicos",
    icon: UserRound,
    path: "/medicos",
  },
  {
    label: "Parking Virtual",
    icon: ParkingCircle,
    path: "/parking",
  },
  {
    label: "Usuarios",
    icon: Users,
    path: "/usuarios",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
      <div className="p-5 border-b border-slate-800">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ParkingCircle className="text-white w-8 h-8" />
          </div>

          <h2 className="mt-3 font-bold text-lg">
            Parking Morales
          </h2>

          <p className="text-xs text-amber-500 mt-1">
            Capacidad total: 37 plazas
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${
                  isActive
                    ? "bg-amber-500 text-black font-semibold"
                    : "hover:bg-slate-800 text-white"
                }`
              }
            >
              <Icon className="w-4 h-4" />

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full bg-red-600 hover:bg-red-700 transition rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />

          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}