// src/pages/reservas/ReservasPage.jsx
import { useEffect, useState } from "react";
import { Plus, CheckCircle, Trash2, Clock, X, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../services/supabase";

const getFechaActual = () => {
  return new Date().toISOString().split('T')[0];
};

const formatHora = (hora) => {
  if (!hora) return "--:--";
  return hora.slice(0, 5);
};

export default function ReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(getFechaActual());
  const [showModal, setShowModal] = useState(false);
  const [nuevaReserva, setNuevaReserva] = useState({
    nombre: "",
    matricula: "",
    lugar: "",
    hora: "09:00"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarReservas();
  }, [fecha]);

  async function cargarReservas() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("fecha", fecha)
      .eq("estado", "pendiente")
      .order("hora", { ascending: true });

    if (error) {
      console.error("Error cargando reservas:", error);
      toast.error("Error al cargar reservas: " + error.message);
      setReservas([]);
    } else {
      setReservas(data || []);
    }
    
    setLoading(false);
  }

  async function handleAgregarReserva(e) {
    e.preventDefault();
    if (!nuevaReserva.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    
    // Enviar null si los campos están vacíos, no strings vacíos
    const reservaData = {
      nombre: nuevaReserva.nombre,
      matricula: nuevaReserva.matricula.trim() === "" ? null : nuevaReserva.matricula,
      lugar: nuevaReserva.lugar.trim() === "" ? null : nuevaReserva.lugar,
      hora: nuevaReserva.hora || null,
      fecha: fecha,
      estado: "pendiente"
    };
    
    console.log("Enviando reserva:", reservaData);
    
    const { error } = await supabase
      .from("reservas")
      .insert([reservaData]);

    if (error) {
      console.error("Error detallado:", error);
      toast.error("❌ Error al guardar: " + error.message);
    } else {
      toast.success("✅ Reserva agregada");
      setShowModal(false);
      setNuevaReserva({ nombre: "", matricula: "", lugar: "", hora: "09:00" });
      cargarReservas();
    }
    
    setSaving(false);
  }

  async function handleCompletar(id, nombre) {
    if (confirm(`¿Marcar como "ya llegó" a ${nombre}?`)) {
      const { error } = await supabase
        .from("reservas")
        .update({ estado: "completada" })
        .eq("id", id);

      if (error) {
        toast.error("❌ Error");
      } else {
        toast.success(`✅ ${nombre} - Ya llegó`);
        cargarReservas();
      }
    }
  }

  async function handleEliminar(id, nombre) {
    if (confirm(`¿Eliminar reserva de ${nombre}?`)) {
      const { error } = await supabase
        .from("reservas")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("❌ Error");
      } else {
        toast.success(`🗑️ Reserva de ${nombre} eliminada`);
        cargarReservas();
      }
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header fijo */}
      <div className="page-header-fixed">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Reservas del día
            </h1>
            <p className="text-slate-400 text-sm">Gestionar reservas de estacionamiento</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 rounded-xl text-white font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar reserva
            </button>
          </div>
        </div>
      </div>

      {/* Lista de reservas con scroll */}
      <div className="table-scroll-container" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay reservas para este día</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-amber-400 text-sm hover:underline"
            >
              Agregar reserva
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-800">
              {reservas.map((reserva) => (
                <div key={reserva.id} className="p-4 hover:bg-slate-800/50 transition">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-white text-lg">{reserva.nombre}</h3>
                        {reserva.matricula && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono">
                            {reserva.matricula}
                          </span>
                        )}
                        {reserva.lugar && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            📍 {reserva.lugar}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        {reserva.hora && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatHora(reserva.hora)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompletar(reserva.id, reserva.nombre)}
                        className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Ya llegó
                      </button>
                      <button
                        onClick={() => handleEliminar(reserva.id, reserva.nombre)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {reservas.length > 0 && (
              <div className="p-3 border-t border-slate-800 bg-slate-800/30 text-center text-xs text-slate-400">
                Total: {reservas.length} reservas pendientes
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal agregar reserva */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30">
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Agregar reserva</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAgregarReserva} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={nuevaReserva.nombre}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, nombre: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white"
                  placeholder="Ej: Dr. Fernando Ruiz"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Matrícula (opcional)</label>
                <input
                  type="text"
                  value={nuevaReserva.matricula}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, matricula: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white uppercase"
                  placeholder="Ej: ABC 1234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Lugar (opcional)</label>
                <input
                  type="text"
                  value={nuevaReserva.lugar}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, lugar: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white uppercase"
                  placeholder="Ej: S1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Hora (opcional)</label>
                <input
                  type="time"
                  value={nuevaReserva.hora}
                  onChange={(e) => setNuevaReserva({ ...nuevaReserva, hora: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}