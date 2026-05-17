// src/pages/parking/ParkingHistoryPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Trash2, Eye, MapPin, Clock, FileText, Download, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import ModalDetalle from "../../components/ModalDetalle";
import ModalConfirmar from "../../components/ModalConfirmar";
import { formatFecha } from "../../utils/dateUtils";
import { exportToPDF } from "../../utils/pdfUtils";
import * as XLSX from "xlsx";
import { useAuth } from "../../hooks/useAuth";

export default function ParkingHistoryPage() {
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const { isAdmin } = useAuth();

  async function cargarHistorial() {
    // CORRECTO
const { data } = await supabase
  .from("parking_history")  // ✅ Tabla correcta
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
      filtrados = filtrados.filter(item => item.fecha_entrada === filtroFecha);
    }
    if (busqueda) {
      const term = busqueda.toLowerCase();
      filtrados = filtrados.filter(item => 
        item.medico_nombre?.toLowerCase().includes(term) ||
        item.medico_matricula?.toLowerCase().includes(term) ||
        item.lugar?.toLowerCase().includes(term)
      );
    }
    setRegistrosFiltrados(filtrados);
  }

  async function exportarPDF() {
    const datosParaPDF = registrosFiltrados.map(item => [
      item.lugar,
      item.medico_nombre,
      item.medico_matricula,
      formatFecha(item.fecha_entrada),
      item.hora_entrada,
      item.fecha_salida ? formatFecha(item.fecha_salida) : "En curso",
      item.hora_salida || "-"
    ]);
    const columnas = ["Lugar", "Médico", "Matrícula", "Fecha Entrada", "Hora Entrada", "Fecha Salida", "Hora Salida"];
    const subtitulo = filtroFecha ? `Filtrado por fecha: ${formatFecha(filtroFecha)}` : "Todos los registros";
    await exportToPDF(datosParaPDF, "Historial de Estacionamiento", subtitulo, columnas);
    toast.success("PDF generado correctamente");
  }

  async function exportarExcel() {
    const datosParaExcel = registrosFiltrados.map(item => ({
      "Lugar": item.lugar,
      "Médico": item.medico_nombre,
      "Matrícula": item.medico_matricula,
      "Fecha Entrada": formatFecha(item.fecha_entrada),
      "Hora Entrada": item.hora_entrada,
      "Fecha Salida": item.fecha_salida ? formatFecha(item.fecha_salida) : "En curso",
      "Hora Salida": item.hora_salida || "-"
    }));
    const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial Estacionamiento");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historial_estacionamiento_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Excel generado correctamente");
  }

  async function eliminarRegistro() {
    if (!itemToDelete) return;
    const { error } = await supabase.from("parking_history").delete().eq("id", itemToDelete.id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success(`✅ Registro del lugar ${itemToDelete.lugar} eliminado`);
      cargarHistorial();
    }
    setModalConfirmOpen(false);
    setItemToDelete(null);
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

  function calcularTiempo(entrada, salida) {
    if (!salida) return "En curso";
    const [h1, m1] = entrada.split(":");
    const [h2, m2] = salida.split(":");
    let diff = (parseInt(h2) * 60 + parseInt(m2)) - (parseInt(h1) * 60 + parseInt(m1));
    if (diff < 0) diff += 24 * 60;
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;
    if (horas === 0) return `${minutos} min`;
    return `${horas}h ${minutos}m`;
  }

  if (cargando) {
    return <div className="text-white p-4">Cargando historial de estacionamiento...</div>;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header fijo */}
      <div className="page-header-fixed" style={{ flexShrink: 0 }}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Historial de Estacionamiento
            </h1>
            <p className="text-slate-400 text-sm">Registro de qué médico estacionó en cada lugar</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={exportarPDF} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button onClick={exportarExcel} className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition">
                <Download className="w-4 h-4" /> Excel
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
              placeholder="Buscar por médico, matrícula o lugar..."
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
                <th>Fecha</th>
                <th>Lugar</th>
                <th>Médico</th>
                <th>Matrícula</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Tiempo</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td className="text-slate-400">{formatFecha(item.fecha_entrada)}</td>
                  <td>
                    <span className="table-badge table-badge-amber inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.lugar}
                    </span>
                  </td>
                  <td className="font-medium">{item.medico_nombre}</td>
                  <td className="font-mono text-slate-400 text-sm">{item.medico_matricula}</td>
                  <td className="text-slate-300">{item.hora_entrada}</td>
                  <td>
                    {item.hora_salida ? (
                      <span className="text-green-400">{item.hora_salida}</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En curso
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`text-sm font-medium ${!item.hora_salida ? 'text-amber-400' : 'text-green-400'}`}>
                      {calcularTiempo(item.hora_entrada, item.hora_salida)}
                    </span>
                  </td>
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
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No hay registros con esos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDetalle isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)} title="Detalle de estacionamiento" data={selectedItem} onDelete={() => {}} type="parking" />
      <ModalConfirmar isOpen={modalConfirmOpen} onClose={() => setModalConfirmOpen(false)} onConfirm={eliminarRegistro} title="Confirmar eliminación" message={`¿Eliminar el registro del lugar ${itemToDelete?.lugar}?`} />
    </div>
  );
}