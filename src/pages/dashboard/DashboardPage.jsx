// src/pages/dashboard/DashboardPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import RegisterVehicleModal from "../../components/modals/RegisterVehicleModal";
import { 
  Car, UserRound, Building2, CalendarClock, 
  TrendingUp, Users, AlertCircle, CheckCircle,
  Activity, Clock, BarChart3
} from "lucide-react";
import { getDashboardStats, getOccupancyByHour, getPrediction } from "../../services/dashboardService";

// Gráfico
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const [openModal, setOpenModal] = useState(false);
  const [selectedType, setSelectedType] = useState("Medico");
  const [stats, setStats] = useState({
    medicos: 0,
    junta: 0,
    reservas: 0,
    totalDentro: 0,
    disponibles: 37,
    ocupacionPorcentaje: 0,
    capacidadMedicos: 33,
    capacidadJunta: 4,
    capacidadTotal: 37,
    plazasOcupadas: 0,
    totalMedicos: 0,
    totalUsuarios: 0,
    ingresosHoy: 0,
    egresosHoy: 0,
    rotacionPromedio: 0,
    alertaCritica: false
  });
  
  const [hourlyData, setHourlyData] = useState(Array(24).fill(0));
  const [prediction, setPrediction] = useState({ texto: "Cargando...", nivel: "media" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    const channel = supabase
      .channel("dashboard-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "active_vehicles" }, () => {
        loadDashboard();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => {
        loadDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);
    const data = await getDashboardStats();
    const hourly = await getOccupancyByHour();
    const pred = await getPrediction();
    
    setStats({
      medicos: data.medicos || 0,
      junta: data.junta || 0,
      reservas: data.reservas || 0,
      totalDentro: data.totalDentro || 0,
      disponibles: data.disponibles || 37,
      ocupacionPorcentaje: data.ocupacionPorcentaje || 0,
      capacidadMedicos: data.capacidadMedicos || 33,
      capacidadJunta: data.capacidadJunta || 4,
      capacidadTotal: data.capacidadTotal || 37,
      plazasOcupadas: data.plazasOcupadas || 0,
      totalMedicos: data.totalMedicos || 0,
      totalUsuarios: data.totalUsuarios || 0,
      ingresosHoy: data.ingresosHoy || 0,
      egresosHoy: data.egresosHoy || 0,
      rotacionPromedio: data.rotacionPromedio || 0,
      alertaCritica: data.alertaCritica || false
    });
    
    setHourlyData(hourly);
    setPrediction(pred);
    setLoading(false);
  }

  function abrirModal(tipo) {
    setSelectedType(tipo);
    setOpenModal(true);
  }

  // Configuración del gráfico
  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Ingresos por hora',
        data: hourlyData,
        fill: true,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#f59e0b' }
    },
    scales: {
      x: { ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 }, grid: { color: '#334155' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } }
    }
  };

  const getAlertaColor = () => {
    if (stats.alertaCritica) return "bg-red-500/20 border-red-500 text-red-400";
    return "bg-emerald-500/20 border-emerald-500 text-emerald-400";
  };

  const getPrediccionColor = () => {
    switch (prediction.nivel) {
      case "alta": return "text-red-400";
      case "media": return "text-amber-400";
      default: return "text-emerald-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel de control</h1>
          <p className="text-sm text-slate-400 mt-1">Visión general del estacionamiento</p>
        </div>
        {/* Botón de registrar ingreso (opcional, se puede mantener) */}
        <button
          onClick={() => abrirModal("Medico")}
          className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar ingreso
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas principales - AHORA CON CLIC */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div onClick={() => abrirModal("Medico")} className="cursor-pointer transition-transform hover:scale-105">
              <StatCard 
                title="MÉDICOS" 
                value={stats.medicos} 
                total={stats.capacidadMedicos}
                icon={<UserRound className="w-5 h-5" />}
                color="blue"
                subtitle="Médicos dentro"
              />
            </div>
            <div onClick={() => abrirModal("Junta")} className="cursor-pointer transition-transform hover:scale-105">
              <StatCard 
                title="JUNTA" 
                value={stats.junta} 
                total={stats.capacidadJunta}
                icon={<Building2 className="w-5 h-5" />}
                color="purple"
                subtitle="Miembros dentro"
              />
            </div>
            <div onClick={() => abrirModal("Reserva")} className="cursor-pointer transition-transform hover:scale-105">
              <StatCard 
                title="RESERVAS" 
                value={stats.reservas} 
                total={stats.capacidadTotal}
                icon={<CalendarClock className="w-5 h-5" />}
                color="green"
                subtitle="Lugares reservados"
              />
            </div>
          </div>

          {/* Segunda fila - Ocupación total */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-white">Ocupación total</h3>
                <p className="text-xs text-slate-500">Estado actual del estacionamiento</p>
              </div>
              <span className="text-2xl font-bold text-white">
                {stats.totalDentro}
                <span className="text-sm text-slate-500">/{stats.capacidadTotal}</span>
              </span>
            </div>
            <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.ocupacionPorcentaje}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Libres: {stats.disponibles}</span>
              <span>Ocupación: {stats.ocupacionPorcentaje}%</span>
            </div>
          </div>

          {/* Gráfico y predicción */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de ocupación por hora */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold pb-3 border-b border-slate-800 text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Ocupación por hora
              </h3>
              <div className="h-64 mt-4">
                <Line data={chartData} options={chartOptions} />
              </div>
              <p className="text-xs text-slate-500 text-center mt-3">📊 Datos reales del historial de hoy</p>
            </div>

            {/* Inteligencia Predictiva */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="font-bold pb-3 border-b border-slate-800 text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Inteligencia Predictiva
              </h3>
              <div className="mt-4 space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">🚗 Plazas disponibles</span>
                    <span className="text-2xl font-bold text-amber-500">{stats.disponibles}</span>
                  </div>
                </div>

                <div className={`rounded-xl p-4 border transition-all ${getAlertaColor()}`}>
                  <div className="flex items-center gap-3">
                    {stats.alertaCritica ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                    <span className="text-sm font-medium">
                      {stats.alertaCritica 
                        ? "⚠️ Ocupación crítica - Quedan pocos lugares" 
                        : "✅ Capacidad normal - Hay lugares disponibles"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-slate-400">Predicción</span>
                  </div>
                  <p className={`text-sm font-medium ${getPrediccionColor()}`}>
                    {prediction.texto}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Administración */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold pb-3 border-b border-slate-800 text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Panel de Administración
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <AdminCard 
                value={stats.totalUsuarios} 
                label="Usuarios" 
                icon={<Users className="w-4 h-4" />}
                color="amber"
              />
              <AdminCard 
                value={stats.ingresosHoy} 
                label="Ingresos hoy" 
                icon={<Clock className="w-4 h-4" />}
                color="blue"
              />
              <AdminCard 
                value={stats.egresosHoy} 
                label="Salidas hoy" 
                icon={<Car className="w-4 h-4" />}
                color="purple"
              />
              <AdminCard 
                value={stats.rotacionPromedio} 
                label="Rotación" 
                icon={<Activity className="w-4 h-4" />}
                color="green"
              />
            </div>
          </div>
        </>
      )}

      {/* Modal con el tipo seleccionado */}
      <RegisterVehicleModal 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        defaultType={selectedType}
      />
    </div>
  );
}

// Componente StatCard (sin cambios)
function StatCard({ title, value, total, icon, color, subtitle }) {
  const colors = {
    blue: "bg-blue-500/20 text-blue-400",
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400"
  };

  const ocupacion = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition-all">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 ${colors[color]}`}>
          {icon} {title}
        </span>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Ocupación</span>
          <span className="font-semibold text-white">{value}/{total}</span>
        </div>
        <div className="bg-slate-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all bg-gradient-to-r ${color === 'blue' ? 'from-blue-500 to-blue-600' : color === 'purple' ? 'from-purple-500 to-purple-600' : 'from-green-500 to-green-600'}`}
            style={{ width: `${ocupacion}%` }}
          />
        </div>
      </div>
      <div className="text-right text-xs text-slate-500">
        Disponibles: {total - value}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );
}

// Componente AdminCard
function AdminCard({ value, label, icon, color }) {
  const colors = {
    amber: "text-amber-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    green: "text-green-400"
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-3 text-center hover:bg-slate-800 transition">
      <div className={`text-2xl font-bold ${colors[color]} mb-1`}>{value}</div>
      <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
        {icon} {label}
      </div>
    </div>
  );
}