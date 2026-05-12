// src/pages/vehicles/ActiveVehiclesPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { exitVehicle } from "../../services/activeVehiclesService";
import { Search, Car, Clock, AlertCircle, LogOut, User, Building2, Star, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

import RegisterVehicleModal from "../../components/modals/RegisterVehicleModal";

export default function ActiveVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [exitModal, setExitModal] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [quickType, setQuickType] = useState("Medico");


  
  const capacidadTotal = 37;

  useEffect(() => {
    loadVehicles();

    const channel = supabase
      .channel("active-vehicles-realtime")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "active_vehicles" }, 
        () => {
          console.log("🔄 Cambio detectado, recargando...");
          loadVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadVehicles() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("active_vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando:", error);
    } else {
      console.log("📊 Vehículos encontrados:", data?.length);
      setVehicles(data || []);
      setFilteredVehicles(data || []);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle =>
        vehicle.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [searchTerm, vehicles]);

  async function handleExit(vehicle) {
    const result = await exitVehicle(vehicle.id, vehicle.nombre, vehicle.matricula);
    
    if (result.success) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "REGISTRO_SALIDA", `${vehicle.nombre} - ${vehicle.matricula}`);
      
      toast.success(`🚗 ${vehicle.nombre} salió del estacionamiento`);
      setExitModal(null);
    } else {
      toast.error(`❌ Error: ${result.error}`);
    }
  }

  function calcularTiempoTranscurrido(horaEntrada) {
    if (!horaEntrada) return "—";
    
    const [hora, minuto] = horaEntrada.split(":");
    const entrada = new Date();
    entrada.setHours(parseInt(hora), parseInt(minuto), 0);
    
    const ahora = new Date();
    let diffMinutos = Math.floor((ahora - entrada) / 60000);
    
    if (diffMinutos < 0) diffMinutos += 24 * 60;
    if (diffMinutos < 1) return "recién";
    
    const horas = Math.floor(diffMinutos / 60);
    const minutos = diffMinutos % 60;
    
    if (horas === 0) return `${minutos} min`;
    if (minutos === 0) return `${horas} h`;
    return `${horas}h ${minutos}m`;
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "Medico": return <User className="w-4 h-4 text-blue-400" />;
      case "Junta": return <Building2 className="w-4 h-4 text-purple-400" />;
      case "Reserva": return <Star className="w-4 h-4 text-green-400" />;
      default: return <Car className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "Medico": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Junta": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Reserva": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-slate-700 text-slate-400";
    }
  };

  const totalOcupados = vehicles.length;
  const porcentajeOcupacion = totalOcupados > 0 ? Math.round((totalOcupados / capacidadTotal) * 100) : 0;

  return (
    <div>
      {/* Header con botón rápido */}
<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
  <div>
    <h1 className="text-2xl font-bold text-white">Vehículos dentro</h1>
    <p className="text-slate-400 text-sm mt-1">Vehículos actualmente estacionados</p>
  </div>
  
  <div className="flex items-center gap-3">
    {/* Selector de tipo rápido */}
    <select
      value={quickType}
      onChange={(e) => setQuickType(e.target.value)}
      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none"
    >
      <option value="Medico">👨‍⚕️ Médico</option>
      <option value="Junta">🏛️ Junta</option>
      <option value="Reserva">⭐ Reserva</option>
    </select>
    
    {/* Botón rápido */}
    <button
      onClick={() => setShowRegisterModal(true)}
      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-lg"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Registrar</span>
    </button>
    
    {/* Buscador */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full sm:w-64 bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-amber-500 focus:outline-none"
      />
    </div>
    
    {/* Contador */}
    <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 rounded-xl font-bold text-white">
      {totalOcupados}/{capacidadTotal}
    </div>
  </div>
</div>

      {/* Barra de ocupación */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Ocupación actual</span>
          <span className="text-white font-semibold">{porcentajeOcupacion}%</span>
        </div>
        <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${porcentajeOcupacion}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>🟢 Libres: {capacidadTotal - totalOcupados}</span>
          <span>🔴 Ocupados: {totalOcupados}</span>
        </div>
      </div>

      {/* Lista de vehículos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Car className="mx-auto w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400">
            {searchTerm ? "No se encontraron vehículos" : "No hay vehículos dentro del estacionamiento"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              onExit={() => setExitModal(vehicle)}
              getTipoIcon={getTipoIcon}
              getTipoColor={getTipoColor}
              calcularTiempo={calcularTiempoTranscurrido}
            />
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {exitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700">
            <div className="p-5 border-b border-slate-700 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirmar salida</h3>
              <p className="text-slate-400 text-sm mt-1">¿Dar salida al siguiente vehículo?</p>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Nombre:</span>
                  <span className="text-white font-semibold">{exitModal.nombre}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-400 text-sm">Matrícula:</span>
                  <span className="text-white font-mono font-semibold">{exitModal.matricula}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-400 text-sm">Hora entrada:</span>
                  <span className="text-white">{exitModal.hora_entrada}</span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setExitModal(null)} className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white font-medium hover:bg-slate-700 transition">
                  Cancelar
                </button>
                <button onClick={() => handleExit(exitModal)} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 py-2.5 rounded-xl font-semibold text-white hover:from-red-700 hover:to-red-800 transition flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Dar salida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro rápido */}
      <RegisterVehicleModal 
        open={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
        onSuccess={() => {
          loadVehicles();
          setShowRegisterModal(false);
        }}
        defaultType={quickType}
      />
    </div>
  );
}

// Componente de tarjeta
function VehicleCard({ vehicle, onExit, getTipoIcon, getTipoColor, calcularTiempo }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/50 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${getTipoColor(vehicle.tipo)}`}>
            {getTipoIcon(vehicle.tipo)}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{vehicle.nombre}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getTipoColor(vehicle.tipo)}`}>
              {vehicle.tipo}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="bg-slate-800/50 rounded-xl p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Matrícula</span>
            <span className="font-mono text-white font-semibold text-sm">{vehicle.matricula}</span>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Entrada
            </span>
            <span className="text-white font-medium text-sm">{vehicle.hora_entrada}</span>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Tiempo
            </span>
            <span className="text-amber-400 font-mono text-sm font-bold">
              {calcularTiempo(vehicle.hora_entrada)}
            </span>
          </div>
        </div>

        {vehicle.sin_tarjeta && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-red-400 text-xs font-medium">Sin tarjeta</span>
            </div>
            {vehicle.sin_tarjeta_motivo && (
              <p className="text-xs text-slate-400 mt-1">Motivo: {vehicle.sin_tarjeta_motivo}</p>
            )}
          </div>
        )}
      </div>

      <button onClick={onExit} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" />
        Dar salida
      </button>
    </div>
  );
}