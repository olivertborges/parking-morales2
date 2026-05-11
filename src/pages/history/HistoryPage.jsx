// src/pages/history/HistoryPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Trash2, Eye, Search, Calendar, FileText } from "lucide-react";
import toast from "react-hot-toast";
import ModalDetalle from "../../components/ModalDetalle";
import ModalConfirmar from "../../components/ModalConfirmar";
import { formatFecha } from "../../utils/dateUtils";
import { exportToPDF } from "../../utils/pdfUtils";
import { useAuth } from "../../hooks/useAuth";



 

export default function HistoryPage() {
  const { isAdmin } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [busqueda, setBusqueda] = useState("");

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
      filtrados = filtrados.filter(item => {
        let fechaBD = item.fecha;
        if (fechaBD && fechaBD.includes("/")) {
          const [dia, mes, año] = fechaBD.split("/");
          fechaBD = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
        return fechaBD === filtroFecha;
      });
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

  if (cargando) {
    return <div className="text-white p-4">Cargando historial...</div>;
  }

return (
        <div className="h-full flex flex-col overflow-hidden">
          {/* Encabezado fijo - sin scroll */}
          <div className="flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Historial de movimientos</h1>
                <p className="text-slate-400 text-sm mt-1">Registro completo de entradas y salidas</p>
              </div>
              <div className="flex gap-2">
                <button onClick={exportarPDF} className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> PDF
                </button>

              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm" />
              </div>
              {(filtroFecha || busqueda) && (
                <button onClick={limpiarFiltros} className="px-4 py-2 bg-slate-700 rounded-xl text-sm text-white">Limpiar</button>
              )}
            </div>
          </div>

          {/* Tabla con scroll interno */}
          <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-left text-slate-300 text-sm">Nombre</th>
                      <th className="p-3 text-left text-slate-300 text-sm">Matrícula</th>
                      <th className="p-3 text-left text-slate-300 text-sm">Tipo</th>
                      <th className="p-3 text-left text-slate-300 text-sm">Entrada</th>
                      <th className="p-3 text-left text-slate-300 text-sm">Salida</th>
                      <th className="p-3 text-left text-slate-300 text-sm">Fecha</th>
                      <th className="p-3 text-center text-slate-300 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((item) => (
                      <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                        <td className="p-3 text-white">{item.nombre}</td>
                        <td className="p-3 text-slate-300">{item.matricula}</td>
                        <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{item.tipo}</span></td>
                        <td className="p-3 text-slate-300">{item.hora_entrada}</td>
                        <td className="p-3 text-slate-300">{item.hora_salida || "En curso"}</td>
                        <td className="p-3 text-slate-300">{formatFecha(item.fecha)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => verDetalle(item)} className="text-emerald-400 mr-2">👁️</button>
                          <button onClick={() => abrirConfirmar(item)} className="text-red-400">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      <ModalDetalle isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)} title="Detalle del movimiento" data={selectedItem} onDelete={() => {}} type="history" />
      <ModalConfirmar isOpen={modalConfirmOpen} onClose={() => setModalConfirmOpen(false)} onConfirm={eliminarRegistro} title="Confirmar eliminación" message={`¿Eliminar el registro de ${itemToDelete?.nombre}?`} />
    </div>
  );
}