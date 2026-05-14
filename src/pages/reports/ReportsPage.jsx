// src/pages/reports/ReportsPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  UserRound, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  X
} from "lucide-react";
import { 
  getMedicosSinTarjeta, 
  getIngresosPorDia,
  exportMedicosSinTarjeta,
  exportIngresosPorDia
} from "../../services/reportsService";
import * as XLSX from "xlsx";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

// Función para formatear fecha a DD/MM/YYYY
const formatFecha = (fecha) => {
  if (!fecha) return "-";
  if (fecha.includes("-")) {
    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  }
  if (fecha.includes("/")) {
    return fecha;
  }
  return fecha;
};

// Función para obtener fecha actual en formato YYYY-MM-DD
const getFechaActual = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para obtener fecha de hace 7 días
const getFechaHace7Dias = () => {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - 7);
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ReportsPage() {
  const [medicosSinTarjeta, setMedicosSinTarjeta] = useState([]);
  const [ingresosPorDia, setIngresosPorDia] = useState([]);
  const [ingresosFiltrados, setIngresosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(getFechaHace7Dias());
  const [fechaFin, setFechaFin] = useState(getFechaActual());
  const [modoFiltro, setModoFiltro] = useState("rango");
  const [filtroDia, setFiltroDia] = useState(getFechaActual());
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filtrarIngresos();
  }, [fechaInicio, fechaFin, filtroDia, modoFiltro, ingresosPorDia]);

  async function loadReports() {
    setLoading(true);
    const medicos = await getMedicosSinTarjeta();
    const ingresos = await getIngresosPorDia();
    
    const medicosFormateados = medicos.map(item => ({
      ...item,
      fecha: formatFecha(item.fecha)
    }));
    
    setMedicosSinTarjeta(medicosFormateados);
    setIngresosPorDia(ingresos);
    setLoading(false);
  }

  function filtrarIngresos() {
    let filtrados = [...ingresosPorDia];
    
    if (modoFiltro === "dia") {
      filtrados = filtrados.filter(item => item.fecha === filtroDia);
    } else {
      filtrados = filtrados.filter(item => {
        return item.fecha >= fechaInicio && item.fecha <= fechaFin;
      });
    }
    
    setIngresosFiltrados(filtrados);
  }

  async function handleExportMedicos() {
    setExporting(true);
    await exportMedicosSinTarjeta();
    setExporting(false);
  }

  async function handleExportIngresos() {
    if (ingresosFiltrados.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    
    setExporting(true);
    
    const formattedData = ingresosFiltrados.map(item => ({
      "Fecha": formatFecha(item.fecha),
      "Ingresos": item.ingresos,
      "Egresos": item.egresos,
      "Pendientes": item.pendientes,
      "Saldo": item.ingresos - item.egresos
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ingresos por día");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingresos_${fechaInicio}_a_${fechaFin}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    
    setExporting(false);
  }

  const totalIngresos = ingresosFiltrados.reduce((sum, item) => sum + item.ingresos, 0);
  const totalEgresos = ingresosFiltrados.reduce((sum, item) => sum + item.egresos, 0);
  const totalPendientes = ingresosFiltrados.reduce((sum, item) => sum + item.pendientes, 0);

  const limpiarFiltros = () => {
    setFechaInicio(getFechaHace7Dias());
    setFechaFin(getFechaActual());
    setFiltroDia(getFechaActual());
    setModoFiltro("rango");
  };

// src/pages/reports/ReportsPage.jsx

// Dentro del componente, después de las funciones existentes
const fechas = async () => {
  const totales = await getTotalesRango("07/05/2026", "14/05/2026");
  console.log("Total vehículos que entraron:", totales.ingresos);
  console.log("Total vehículos que salieron:", totales.egresos);
  console.log("Vehículos dentro:", totales.pendientes);
};

// Puedes llamar a la función cuando quieras, por ejemplo en un useEffect
useEffect(() => {
  fechas();
}, []);

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-slate-400 text-sm mt-1">Análisis y exportación de datos del estacionamiento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Médicos sin tarjeta */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Médicos sin tarjeta</h2>
                  <p className="text-xs text-slate-400">Registro de ingresos sin credencial</p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={handleExportMedicos}
                  disabled={exporting || medicosSinTarjeta.length === 0}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {exporting ? "Exportando..." : "Exportar Excel"}
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
              </div>
            ) : medicosSinTarjeta.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-slate-400">No hay registros de médicos sin tarjeta</p>
                <p className="text-xs text-slate-500 mt-1">Todos los ingresos registraron tarjeta</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-slate-300 text-xs font-semibold">Médico</th>
                    <th className="text-left p-3 text-slate-300 text-xs font-semibold">Matrícula</th>
                    <th className="text-left p-3 text-slate-300 text-xs font-semibold">Motivo</th>
                    <th className="text-left p-3 text-slate-300 text-xs font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {medicosSinTarjeta.map((item) => (
                    <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                      <td className="p-3 text-white text-sm">{item.nombre}</td>
                      <td className="p-3 text-slate-300 text-xs font-mono">{item.matricula}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                          {item.sin_tarjeta_motivo}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">{formatFecha(item.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {medicosSinTarjeta.length > 0 && (
            <div className="p-3 border-t border-slate-800 bg-slate-800/30">
              <p className="text-xs text-slate-400 text-center">
                Total: {medicosSinTarjeta.length} registros sin tarjeta
              </p>
            </div>
          )}
        </div>

        {/* Card: Ingresos por día */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Ingresos por día</h2>
                  <p className="text-xs text-slate-400">Movimientos filtrados por fecha</p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={handleExportIngresos}
                  disabled={exporting || ingresosFiltrados.length === 0}
                  className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {exporting ? "Exportando..." : "Exportar"}
                </button>
              )}
            </div>
            
            <div className="mt-4 flex gap-2 border-b border-slate-700 pb-3">
              <button
                onClick={() => setModoFiltro("rango")}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  modoFiltro === "rango" 
                    ? "bg-amber-500 text-white" 
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                📅 Rango de fechas
              </button>
              <button
                onClick={() => setModoFiltro("dia")}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  modoFiltro === "dia" 
                    ? "bg-amber-500 text-white" 
                    : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                📆 Día específico
              </button>
              <button
                onClick={limpiarFiltros}
                className="px-3 py-1 rounded-lg text-sm bg-slate-700 text-slate-400 hover:bg-slate-600 transition flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            </div>
            
            <div className="mt-4">
              {modoFiltro === "rango" ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={filtroDia}
                    onChange={(e) => setFiltroDia(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-3 text-xs text-slate-500">
              {modoFiltro === "rango" ? (
                <span>Mostrando datos del {formatFecha(fechaInicio)} al {formatFecha(fechaFin)}</span>
              ) : (
                <span>Mostrando datos del {formatFecha(filtroDia)}</span>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
              </div>
            ) : ingresosFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-400">No hay datos para el período seleccionado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-slate-300 text-xs font-semibold">Fecha</th>
                    <th className="text-center p-3 text-slate-300 text-xs font-semibold">Ingresos</th>
                    <th className="text-center p-3 text-slate-300 text-xs font-semibold">Egresos</th>
                    <th className="text-center p-3 text-slate-300 text-xs font-semibold">Pendientes</th>
                    <th className="text-center p-3 text-slate-300 text-xs font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresosFiltrados.map((item) => (
                    <tr key={item.fecha} className="border-t border-slate-800 hover:bg-slate-800/50">
                      <td className="p-3 text-white text-sm">{formatFecha(item.fecha)}</td>
                      <td className="p-3 text-center text-green-400 text-sm font-medium">{item.ingresos}</td>
                      <td className="p-3 text-center text-red-400 text-sm font-medium">{item.egresos}</td>
                      <td className="p-3 text-center text-amber-400 text-sm font-medium">{item.pendientes}</td>
                      <td className="p-3 text-center text-blue-400 text-sm font-medium">{item.ingresos - item.egresos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {ingresosFiltrados.length > 0 && (
            <div className="p-3 border-t border-slate-800 bg-slate-800/30">
              <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                <span className="text-slate-400">Total ingresos: <span className="text-green-400 font-bold">{totalIngresos}</span></span>
                <span className="text-slate-400">Total egresos: <span className="text-red-400 font-bold">{totalEgresos}</span></span>
                <span className="text-slate-400">Pendientes: <span className="text-amber-400 font-bold">{totalPendientes}</span></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}