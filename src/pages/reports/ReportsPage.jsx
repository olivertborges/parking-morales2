// src/pages/reports/ReportsPage.jsx
import { useEffect, useState } from "react";
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  UserRound, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { 
  getMedicosSinTarjeta, 
  getIngresosPorDia,
  exportMedicosSinTarjeta,
  exportIngresosPorDia
} from "../../services/reportsService";
import { useAuth } from "../../hooks/useAuth";

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [medicosSinTarjeta, setMedicosSinTarjeta] = useState([]);
  const [ingresosPorDia, setIngresosPorDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const medicos = await getMedicosSinTarjeta();
    const ingresos = await getIngresosPorDia();
    setMedicosSinTarjeta(medicos);
    setIngresosPorDia(ingresos);
    setLoading(false);
  }

  async function handleExportMedicos() {
    setExporting(true);
    await exportMedicosSinTarjeta();
    setExporting(false);
  }

  async function handleExportIngresos() {
    setExporting(true);
    await exportIngresosPorDia();
    setExporting(false);
  }

  const totalIngresos = ingresosPorDia.reduce((sum, item) => sum + item.ingresos, 0);
  const totalEgresos = ingresosPorDia.reduce((sum, item) => sum + item.egresos, 0);
  const totalPendientes = ingresosPorDia.reduce((sum, item) => sum + item.pendientes, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-slate-400 text-sm mt-1">Análisis y exportación de datos del estacionamiento</p>
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
              <button
                onClick={handleExportMedicos}
                disabled={exporting || medicosSinTarjeta.length === 0}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting ? "Exportando..." : "Exportar Excel"}
              </button>
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
                      <td className="p-3 text-slate-400 text-xs">{item.fecha}</td>
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
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Ingresos por día</h2>
                  <p className="text-xs text-slate-400">Movimientos del mes actual</p>
                </div>
              </div>
              <button
                onClick={handleExportIngresos}
                disabled={exporting || ingresosPorDia.length === 0}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exporting ? "Exportando..." : "Exportar Excel"}
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
              </div>
            ) : ingresosPorDia.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-400">No hay datos de ingresos</p>
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
                  {ingresosPorDia.map((item) => (
                    <tr key={item.fecha} className="border-t border-slate-800 hover:bg-slate-800/50">
                      <td className="p-3 text-white text-sm">{item.fecha}</td>
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
          
          {ingresosPorDia.length > 0 && (
            <div className="p-3 border-t border-slate-800 bg-slate-800/30">
              <div className="flex justify-between items-center text-xs">
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