// src/pages/history/HistoryPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Trash2, Eye, Search, Calendar, FileText, Edit2, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import ModalDetalle from "../../components/ModalDetalle";
import ModalConfirmar from "../../components/ModalConfirmar";
import { formatFecha } from "../../utils/dateUtils";
import { exportToPDF } from "../../utils/pdfUtils";
import { useAuth } from "../../hooks/useAuth";

export default function HistoryPage() {
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const { isAdmin } = useAuth();

  async function cargarHistorial() {
    const { data } = await supabase
      .from("history")
      .select("*")
      .order("created_at", { ascending: false });
    setRegistros(data || []);
    setRegistrosFiltrados(data || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    filtrarRegistros();
  }, [filtroFecha, busqueda, registros]);

  function filtrarRegistros() {
    let filtrados = [...registros];
    if (filtroFecha) {
      filtrados = filtrados.filter(item => item.fecha === filtroFecha);
    }
    if (busqueda) {
      const term = busqueda.toLowerCase();
      filtrados = filtrados.filter(item =>
        item.nombre?.toLowerCase().includes(term) ||
        item.matricula?.toLowerCase().includes(term)
      );
    }
    setRegistrosFiltrados(filtrados);
  }

  async function exportarPDF() {
    const datosParaPDF = registrosFiltrados.map(item => [
      item.hora_entrada || "-",
      item.hora_salida || "En curso",
      item.nombre,
      item.matricula,
      item.tipo || "-"
    ]);
    const columnas = ["Entrada", "Salida", "Nombre", "Matrícula", "Tipo"];
    const subtitulo = filtroFecha ? `Filtrado por fecha: ${formatFecha(filtroFecha)}` : "Todos los registros";
    await exportToPDF(datosParaPDF, "Historial de Movimientos", subtitulo, columnas);
    toast.success("PDF generado correctamente");
  }

  async function eliminarRegistro() {
    if (!itemToDelete) return;
    const { error } = await supabase.from("history").delete().eq("id", itemToDelete.id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success(`✅ Registro de ${itemToDelete.nombre} eliminado`);
      cargarHistorial();
    }
    setModalConfirmOpen(false);
    setItemToDelete(null);
  }

  async function actualizarNombre(id, nuevoNombre, nombreAnterior) {
    if (!nuevoNombre.trim()) {
      toast.error("El nombre no puede estar vacío");
      setEditandoId(null);
      return;
    }
    
    const { error } = await supabase
      .from("history")
      .update({ nombre: nuevoNombre })
      .eq("id", id);
    
    if (error) {
      toast.error("Error al actualizar el nombre");
    } else {
      toast.success(`✅ Nombre actualizado: ${nombreAnterior} → ${nuevoNombre}`);
      cargarHistorial();
    }
    setEditandoId(null);
  }


  async function actualizarNombre(id, nuevoNombre, nombreAnterior, matricula) {
  // 1. Actualizar en history
  const { error: historyError } = await supabase
    .from("history")
    .update({ nombre: nuevoNombre })
    .eq("id", id);
  
  if (historyError) {
    toast.error("Error al actualizar el nombre en historial");
    return;
  }
  
  // 2. Actualizar también en doctors si existe
  const { error: doctorError } = await supabase
    .from("doctors")
    .update({ nombre: nuevoNombre })
    .eq("matricula", matricula);
  
  if (doctorError) {
    // No es un error crítico, solo informativo
    console.log("No se encontró el médico en la tabla doctors");
  }
  
  toast.success(`✅ Nombre actualizado: ${nombreAnterior} → ${nuevoNombre}`);
  cargarHistorial();
  setEditandoId(null);
}


  function iniciarEdicion(item) {
    setEditandoId(item.id);
    setEditandoNombre(item.nombre);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditandoNombre("");
  }

  function abrirConfirmar(item) {
    setItemToDelete(item);
    setModalConfirmOpen(true);
  }

  function verDetalle(item) {
    setSelectedItem(item);
    setModalDetalleOpen(true);
  }

  function limpiarFiltros() {
    setFiltroFecha("");
    setBusqueda("");
  }

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case "Medico": return "table-badge-blue";
      case "Junta": return "table-badge-purple";
      case "Reserva": return "table-badge-green";
      default: return "table-badge-gray";
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "Medico": return "👨‍⚕️";
      case "Junta": return "🏛️";
      case "Reserva": return "⭐";
      default: return "🚗";
    }
  };

  if (cargando) {
    return <div className="text-white p-4">Cargando historial...</div>;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header fijo */}
      <div className="page-header-fixed">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Historial de movimientos
            </h1>
            <p className="text-slate-400 text-sm">Registro completo de entradas y salidas</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={exportarPDF} className="btn-premium px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" /> PDF
                </button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o matrícula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>
          <div className="relative sm:w-56">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>
          {(filtroFecha || busqueda) && (
            <button onClick={limpiarFiltros} className="px-4 py-2 bg-slate-700 rounded-xl text-sm text-white hover:bg-slate-600 transition">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla con scroll interno */}
      <div className="table-scroll-container" style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <div className="table-modern-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Matrícula</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Fecha</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>
                    {editandoId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editandoNombre}
                          onChange={(e) => setEditandoNombre(e.target.value)}
                          className="bg-slate-700 border border-amber-500 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => actualizarNombre(item.id, editandoNombre, item.nombre)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.nombre}</span>
                        {isAdmin && (
                          <button
                            onClick={() => iniciarEdicion(item)}
                            className="text-slate-500 hover:text-amber-400 transition"
                            title="Editar nombre"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="font-mono text-slate-400 text-sm">{item.matricula}</td>
                  <td>
                    <span className={`table-badge ${getTipoBadge(item.tipo)}`}>
                      {getTipoIcon(item.tipo)} {item.tipo}
                    </span>
                  </td>
                  <td className="text-slate-300">{item.hora_entrada || "—"}</td>
                  <td>
                    {item.hora_salida ? (
                      <span className="text-green-400">{item.hora_salida}</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                        En curso
                      </span>
                    )}
                  </td>
                  <td className="text-slate-400">{formatFecha(item.fecha)}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => verDetalle(item)}
                        className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition flex items-center justify-center"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-emerald-400" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => abrirConfirmar(item)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition flex items-center justify-center"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {registrosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No hay registros con esos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDetalle isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)} title="Detalle del movimiento" data={selectedItem} onDelete={() => {}} type="history" />
      <ModalConfirmar isOpen={modalConfirmOpen} onClose={() => setModalConfirmOpen(false)} onConfirm={eliminarRegistro} title="Confirmar eliminación" message={`¿Eliminar el registro de ${itemToDelete?.nombre}?`} />
    </div>
  );
}