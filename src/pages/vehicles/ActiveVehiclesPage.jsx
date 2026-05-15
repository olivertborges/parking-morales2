// src/pages/vehicles/ActiveVehiclesPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { 
  Search, 
  LogOut, 
  Clock, 
  Car,
  AlertCircle,
  X,
  User
} from "lucide-react";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

// Componente Modal para Salida Manual
const SalidaManualModal = ({ open, onClose, onSuccess }) => {
  const [matricula, setMatricula] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [vehiculoEncontrado, setVehiculoEncontrado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const buscarVehiculo = async () => {
    if (!matricula || matricula.length < 4) {
      toast.error("Ingrese una matrícula válida (mínimo 4 caracteres)");
      return;
    }
    
    setBuscando(true);
    setVehiculoEncontrado(null);
    
    const matriculaLimpia = matricula.replace(/\s/g, '').toUpperCase();
    
    // 1. Buscar en active_vehicles primero
    const { data: activo, error: errorActivo } = await supabase
      .from("active_vehicles")
      .select("*")
      .eq("matricula", matriculaLimpia)
      .single();
    
    if (activo) {
      setVehiculoEncontrado({ ...activo, origen: "active" });
      setBuscando(false);
      return;
    }
    
    // 2. Buscar en history (sin hora_salida)
    const { data: historico, error: errorHistorico } = await supabase
      .from("history")
      .select("*")
      .eq("matricula", matriculaLimpia)
      .is("hora_salida", null)
      .order("hora_entrada", { ascending: false })
      .limit(1);
    
    if (historico && historico.length > 0) {
      setVehiculoEncontrado({ ...historico[0], origen: "history" });
    } else {
      toast.error("No se encontró ningún vehículo con esa matrícula pendiente de salida");
    }
    
    setBuscando(false);
  };

  const confirmarSalida = async () => {
    if (!vehiculoEncontrado) return;
    
    setCargando(true);
    const hora_salida = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const fecha_salida = new Date().toISOString().split('T')[0];
    
    if (vehiculoEncontrado.origen === "active") {
      // Salida normal desde active_vehicles
      await supabase.from("active_vehicles").delete().eq("id", vehiculoEncontrado.id);
      await supabase
        .from("history")
        .update({ 
          hora_salida: hora_salida,
          fecha_salida: fecha_salida,
          salida_manual: false 
        })
        .eq("id", vehiculoEncontrado.id);
    } else {
      // Salida manual desde history
      await supabase
        .from("history")
        .update({ 
          hora_salida: hora_salida,
          fecha_salida: fecha_salida,
          salida_manual: true 
        })
        .eq("id", vehiculoEncontrado.id);
    }
    
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    await addLog(user.nombre || "Anónimo", "SALIDA_MANUAL", `${vehiculoEncontrado.nombre} - ${vehiculoEncontrado.matricula}`);
    
    toast.success(`✅ Salida registrada para ${vehiculoEncontrado.nombre}`);
    setVehiculoEncontrado(null);
    setMatricula("");
    onSuccess();
    onClose();
    setCargando(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-red-500/30 shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Salida Manual</h3>
              <p className="text-slate-400 text-xs">Para vehículos que ya salieron</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Matrícula</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl p-3 text-white uppercase font-mono tracking-wide focus:border-amber-500 focus:outline-none"
                placeholder="ABC 1234"
                autoComplete="off"
              />
              <button
                onClick={buscarVehiculo}
                disabled={buscando}
                className="px-4 bg-amber-500 rounded-xl text-white hover:bg-amber-600 transition disabled:opacity-50"
              >
                {buscando ? "..." : "Buscar"}
              </button>
            </div>
          </div>
          
          {vehiculoEncontrado && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm font-medium flex items-center gap-1">
                <Car className="w-3 h-3" /> Vehículo encontrado
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-white"><span className="text-slate-400">Nombre:</span> {vehiculoEncontrado.nombre}</p>
                <p className="text-white"><span className="text-slate-400">Matrícula:</span> {vehiculoEncontrado.matricula}</p>
                <p className="text-white"><span className="text-slate-400">Hora entrada:</span> {vehiculoEncontrado.hora_entrada}</p>
                <p className="text-white"><span className="text-slate-400">Tipo:</span> {vehiculoEncontrado.tipo}</p>
                {vehiculoEncontrado.origen === "history" && (
                  <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Este vehículo no está en el estacionamiento activo. Se registrará salida manual.
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white hover:bg-slate-700 transition">
              Cancelar
            </button>
            <button
              onClick={confirmarSalida}
              disabled={!vehiculoEncontrado || cargando}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold disabled:opacity-50 transition"
            >
              {cargando ? "Procesando..." : "Confirmar Salida"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ActiveVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [exitLoading, setExitLoading] = useState(null);
  const [showSalidaManual, setShowSalidaManual] = useState(false);

  useEffect(() => {
    loadActiveVehicles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vehicles.filter(vehicle =>
        vehicle.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [searchTerm, vehicles]);

  async function loadActiveVehicles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("active_vehicles")
      .select("*")
      .order("hora_entrada", { ascending: true });
    
    if (!error && data) {
      setVehicles(data);
      setFilteredVehicles(data);
    }
    setLoading(false);
  }

  async function handleExit(vehicle) {
    if (!confirm(`¿Registrar salida de ${vehicle.nombre} - ${vehicle.matricula}?`)) return;
    
    setExitLoading(vehicle.id);
    const hora_salida = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const fecha_salida = new Date().toISOString().split('T')[0];
    
    // 1. Eliminar de active_vehicles
    const { error: deleteError } = await supabase
      .from("active_vehicles")
      .delete()
      .eq("id", vehicle.id);
    
    if (deleteError) {
      toast.error("Error al registrar salida");
      setExitLoading(null);
      return;
    }
    
    // 2. Actualizar history con hora_salida
    const { error: updateError } = await supabase
      .from("history")
      .update({ 
        hora_salida: hora_salida,
        fecha_salida: fecha_salida
      })
      .eq("id", vehicle.id);
    
    if (updateError) {
      toast.error("Error al actualizar historial");
    } else {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "REGISTRO_SALIDA", `${vehicle.nombre} - ${vehicle.matricula}`);
      toast.success(`✅ Salida registrada: ${vehicle.nombre}`);
      loadActiveVehicles();
    }
    
    setExitLoading(null);
  }

  const getTipoBadge = (tipo) => {
    if (tipo === "Medico") return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    if (tipo === "Junta") return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    if (tipo === "Reserva") return "bg-green-500/20 text-green-400 border border-green-500/30";
    return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  };

  const getTipoIcon = (tipo) => {
    if (tipo === "Medico") return "👨‍⚕️";
    if (tipo === "Junta") return "🏛️";
    if (tipo === "Reserva") return "⭐";
    return "🚗";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehículos dentro</h1>
          <p className="text-slate-400 text-sm mt-1">Vehículos actualmente en el estacionamiento</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowSalidaManual(true)}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Salida Manual
          </button>
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
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Hora entrada</th>
                <th className="text-center p-4 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-slate-400">
                    {searchTerm ? "No se encontraron vehículos" : "No hay vehículos en el estacionamiento"}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="p-4 text-white font-medium">{vehicle.nombre}</td>
                    <td className="p-4 text-slate-300 font-mono text-sm">{vehicle.matricula}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getTipoBadge(vehicle.tipo)}`}>
                        {getTipoIcon(vehicle.tipo)} {vehicle.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {vehicle.hora_entrada}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleExit(vehicle)}
                          disabled={exitLoading === vehicle.id}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <LogOut className="w-4 h-4" />
                          {exitLoading === vehicle.id ? "..." : "Salida"}
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
            Total: {filteredVehicles.length} vehículos • Capacidad máxima: 37 plazas
          </p>
        </div>
      </div>

      {/* Modal de Salida Manual */}
      <SalidaManualModal
        open={showSalidaManual}
        onClose={() => setShowSalidaManual(false)}
        onSuccess={loadActiveVehicles}
      />
    </div>
  );
}