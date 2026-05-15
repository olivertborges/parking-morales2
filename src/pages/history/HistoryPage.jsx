// src/pages/history/HistoryPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { 
  Search, 
  Eye, 
  Clock, 
  Car, 
  User,
  Calendar,
  X,
  Save,
  Edit2
} from "lucide-react";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

// Modal de Detalle con opción de editar hora de salida
const DetalleModal = ({ open, onClose, vehiculo, onSuccess }) => {
  const [editando, setEditando] = useState(false);
  const [horaSalida, setHoraSalida] = useState("");
  const [cargando, setCargando] = useState(false);
  const [motivo, setMotivo] = useState("");

  // Cuando se abre el modal, cargar la hora de salida actual
  useEffect(() => {
    if (vehiculo) {
      setHoraSalida(vehiculo.hora_salida || "");
      setMotivo("");
      setEditando(false);
    }
  }, [vehiculo]);

  const guardarHoraSalida = async () => {
    if (!horaSalida) {
      toast.error("Debe seleccionar una hora de salida");
      return;
    }
    
    setCargando(true);
    
    const fecha_salida = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from("history")
      .update({ 
        hora_salida: horaSalida,
        fecha_salida: fecha_salida,
        salida_editada: true,
        motivo_edicion: motivo || "Edición manual desde historial"
      })
      .eq("id", vehiculo.id);
    
    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "EDITAR_SALIDA", `${vehiculo.nombre} - ${vehiculo.matricula} - Nueva hora: ${horaSalida}`);
      toast.success(`✅ Hora de salida actualizada`);
      onSuccess();
      onClose();
    }
    
    setCargando(false);
  };

  if (!open || !vehiculo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Detalle del Vehículo</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Información del vehículo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <User className="w-4 h-4" />
              <span>Nombre:</span>
              <span className="text-white font-medium">{vehiculo.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Car className="w-4 h-4" />
              <span>Matrícula:</span>
              <span className="text-white font-mono">{vehiculo.matricula}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-4 h-4">👨‍⚕️</span>
              <span>Tipo:</span>
              <span className="text-white">{vehiculo.tipo || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Fecha entrada:</span>
              <span className="text-white">{vehiculo.fecha_entrada || new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Hora entrada:</span>
              <span className="text-white">{vehiculo.hora_entrada}</span>
            </div>
            
            {/* Hora de salida - Editable */}
            <div className="border-t border-slate-700 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Hora salida:</span>
                </div>
                {!vehiculo.hora_salida && !editando && (
                  <button
                    onClick={() => setEditando(true)}
                    className="p-1 text-blue-400 hover:text-blue-300 transition"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {editando ? (
                <div className="mt-2 space-y-3">
                  <input
                    type="time"
                    value={horaSalida}
                    onChange={(e) => setHoraSalida(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                  <textarea
                    placeholder="Motivo de la edición (opcional)"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditando(false)}
                      className="flex-1 py-1.5 border border-slate-600 rounded-lg text-white text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={guardarHoraSalida}
                      disabled={cargando}
                      className="flex-1 py-1.5 bg-amber-500 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      {cargando ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1">
                  {vehiculo.hora_salida ? (
                    <span className="text-white font-mono">{vehiculo.hora_salida}</span>
                  ) : (
                    <span className="text-yellow-400 text-sm">⚠️ Sin registrar - Editar para completar</span>
                  )}
                  {vehiculo.salida_editada && (
                    <p className="text-xs text-blue-400 mt-1">✏️ Editado manualmente</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t border-slate-700">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition">
            Cerrar
          </button>
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
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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

  const getStatusBadge = (item) => {
    if (item.hora_salida) {
      if (item.salida_editada) return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    }
    return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  };

  const getStatusText = (item) => {
    if (item.hora_salida) {
      if (item.salida_editada) return "Editado";
      return "Completado";
    }
    return "En curso";
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

      {/* Tabla - SIN MODIFICAR */}
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
                      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${getStatusBadge(item)}`}>
                        {getStatusText(item)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedVehicle(item)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                        </button>
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

      {/* Modal de Detalle */}
      <DetalleModal
        open={selectedVehicle !== null}
        vehiculo={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onSuccess={loadHistory}
      />
    </div>
  );
}