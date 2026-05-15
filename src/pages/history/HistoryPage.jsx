// src/pages/history/HistoryPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { 
  Search, 
  Calendar, 
  Clock, 
  Car, 
  User,
  LogOut,
  AlertCircle,
  X,
  CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

// Modal para forzar salida
const ForzarSalidaModal = ({ open, onClose, vehiculo, onSuccess }) => {
  const [cargando, setCargando] = useState(false);
  const [motivo, setMotivo] = useState("");

  const confirmarSalida = async () => {
    if (!motivo.trim()) {
      toast.error("Debe ingresar un motivo para forzar la salida");
      return;
    }
    
    setCargando(true);
    const hora_salida = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const fecha_salida = new Date().toISOString().split('T')[0];
    
    // Actualizar el historial con la hora de salida
    const { error } = await supabase
      .from("history")
      .update({ 
        hora_salida: hora_salida,
        fecha_salida: fecha_salida,
        salida_forzada: true,
        motivo_salida_forzada: motivo
      })
      .eq("id", vehiculo.id);
    
    if (error) {
      toast.error("Error al forzar salida: " + error.message);
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "SALIDA_FORZADA", `${vehiculo.nombre} - ${vehiculo.matricula} - Motivo: ${motivo}`);
      toast.success(`✅ Salida forzada registrada para ${vehiculo.nombre}`);
      onSuccess();
      onClose();
    }
    
    setCargando(false);
  };

  if (!open || !vehiculo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-red-500/30 shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Forzar Salida</h3>
              <p className="text-slate-400 text-xs">El vehículo ya no está en el estacionamiento</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm font-medium">⚠️ Vehículo en curso</p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-white"><span className="text-slate-400">Nombre:</span> {vehiculo.nombre}</p>
              <p className="text-white"><span className="text-slate-400">Matrícula:</span> {vehiculo.matricula}</p>
              <p className="text-white"><span className="text-slate-400">Hora entrada:</span> {vehiculo.hora_entrada}</p>
              <p className="text-white"><span className="text-slate-400">Fecha entrada:</span> {vehiculo.fecha_entrada || new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Motivo de la salida forzada *</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none resize-none"
              rows="3"
              placeholder="Ej: El vehículo salió pero no se registró, error del sistema, etc."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white hover:bg-slate-700 transition">
              Cancelar
            </button>
            <button
              onClick={confirmarSalida}
              disabled={cargando || !motivo.trim()}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold disabled:opacity-50 transition"
            >
              {cargando ? "Procesando..." : "Forzar Salida"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [forzandoSalida, setForzandoSalida] = useState(null);
  const [vehiculoForzar, setVehiculoForzar] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = history.filter(item =>
        item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(history);
    }
  }, [searchTerm, history]);

  async function loadHistory() {
    setLoading(true);
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .order("hora_entrada", { ascending: false });
    
    if (!error && data) {
      setHistory(data);
      setFilteredHistory(data);
    }
    setLoading(false);
  }

  async function forzarSalida(vehiculo) {
    setForzandoSalida(vehiculo.id);
    const hora_salida = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const fecha_salida = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from("history")
      .update({ 
        hora_salida: hora_salida,
        fecha_salida: fecha_salida,
        salida_forzada: true
      })
      .eq("id", vehiculo.id);
    
    if (error) {
      toast.error("Error al forzar salida: " + error.message);
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "SALIDA_FORZADA", `${vehiculo.nombre} - ${vehiculo.matricula}`);
      toast.success(`✅ Salida forzada registrada para ${vehiculo.nombre}`);
      loadHistory();
    }
    
    setForzandoSalida(null);
  }

  const getStatusBadge = (item) => {
    if (item.hora_salida) {
      if (item.salida_forzada) {
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      }
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    }
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  const getStatusText = (item) => {
    if (item.hora_salida) {
      if (item.salida_forzada) return "Salida Forzada";
      return "Completado";
    }
    return "En curso";
  };

  const getStatusIcon = (item) => {
    if (item.hora_salida) {
      if (item.salida_forzada) return <AlertCircle className="w-3 h-3" />;
      return <CheckCircle className="w-3 h-3" />;
    }
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Estacionamiento</h1>
          <p className="text-slate-400 text-sm mt-1">Registro completo de ingresos y salidas</p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-amber-500 focus:outline-none transition"
        />
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Nombre</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Matrícula</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Tipo</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Fecha entrada</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Hora entrada</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Hora salida</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Estado</th>
                <th className="text-center p-4 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-400">
                    {searchTerm ? "No se encontraron registros" : "No hay registros en el historial"}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="p-4 text-white font-medium">{item.nombre}</td>
                    <td className="p-4 text-slate-300 font-mono text-sm">{item.matricula}</td>
                    <td className="p-4 text-slate-300 text-sm">{item.tipo || "—"}</td>
                    <td className="p-4 text-slate-300 text-sm">{item.fecha_entrada || new Date().toLocaleDateString()}</td>
                    <td className="p-4 text-slate-300 text-sm">{item.hora_entrada}</td>
                    <td className="p-4 text-slate-300 text-sm">{item.hora_salida || "—"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusBadge(item)}`}>
                        {getStatusIcon(item)} {getStatusText(item)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        {!item.hora_salida && (
                          <button
                            onClick={() => setVehiculoForzar(item)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition flex items-center gap-2 text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            Forzar Salida
                          </button>
                        )}
                        {item.hora_salida && item.salida_forzada && (
                          <span className="text-xs text-red-400">Salida forzada</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-800/30">
          <p className="text-xs text-slate-400">
            Total: {filteredHistory.length} registros
          </p>
        </div>
      </div>

      {/* Modal para forzar salida */}
      <ForzarSalidaModal
        open={vehiculoForzar !== null}
        vehiculo={vehiculoForzar}
        onClose={() => setVehiculoForzar(null)}
        onSuccess={loadHistory}
      />
    </div>
  );
}