// src/pages/parking/ParkingHistoryPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Trash2, Eye, MapPin, Clock, Search, Calendar, FileText } from "lucide-react";
import toast from "react-hot-toast";
import ModalDetalle from "../../components/ModalDetalle";
import ModalConfirmar from "../../components/ModalConfirmar";
import { formatFecha } from "../../utils/dateUtils";
import { exportToPDF } from "../../utils/pdfUtils";
import { useAuth } from "../../hooks/useAuth";

export default function ParkingHistoryPage() {
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
      .from("parking_history")
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

// src/pages/parking/ParkingHistoryPage.jsx

function filtrarRegistros() {
  let filtrados = [...registros];
  
  // Filtro por fecha
  if (filtroFecha) {
    filtrados = filtrados.filter(item => {
      let fechaBD = item.fecha_entrada;
      
      // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      if (fechaBD && fechaBD.includes("/")) {
        const [dia, mes, año] = fechaBD.split("/");
        fechaBD = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
      
      return fechaBD === filtroFecha;
    });
  }
  
  // Filtro por búsqueda
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

// src/pages/parking/ParkingHistoryPage.jsx

async function exportarPDF() {
  const datosParaPDF = registrosFiltrados.map(item => [
    item.lugar,
    item.medico_nombre,
    item.medico_matricula,
    item.fecha_entrada,
    item.hora_entrada,
    item.fecha_salida || "En curso",
    item.hora_salida || "-"
  ]);
  
  const columnas = ["LUGAR", "MÉDICO", "MATRÍCULA", "FECHA ENTRADA", "HORA ENTRADA", "FECHA SALIDA", "HORA SALIDA"];
  const subtitulo = filtroFecha ? `Filtrado por fecha: ${formatFecha(filtroFecha)}` : "Todos los registros";
  
  await exportToPDF(datosParaPDF, "estacionamiento", subtitulo, columnas);
  toast.success("PDF generado correctamente");
}

  async function eliminarRegistro() {
    if (!itemToDelete) return;
    
    const { error } = await supabase
      .from("parking_history")
      .delete()
      .eq("id", itemToDelete.id);
      
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Estacionamiento</h1>
          <p className="text-slate-400 text-sm mt-1">Registro de qué médico estacionó en cada lugar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarPDF}
            disabled={registrosFiltrados.length === 0}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>

        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por médico, matrícula o lugar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm"
          />
        </div>
        {(filtroFecha || busqueda) && (
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 bg-slate-700 rounded-xl text-sm text-white hover:bg-slate-600"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Fecha</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Lugar</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Médico</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Matrícula</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Entrada</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Salida</th>
                <th className="text-left p-3 text-slate-300 font-semibold text-sm">Tiempo</th>
                <th className="text-center p-3 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((item) => (
                <tr key={item.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="p-3 text-slate-300 text-sm">{formatFecha(item.fecha_entrada)}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                      <MapPin className="w-3 h-3" />
                      {item.lugar}
                    </span>
                  </td>
                  <td className="p-3 text-white text-sm">{item.medico_nombre}</td>
                  <td className="p-3 text-slate-300 font-mono text-sm">{item.medico_matricula}</td>
                  <td className="p-3 text-slate-300 text-sm">{item.hora_entrada}</td>
                  <td className="p-3">
                    {item.hora_salida ? (
                      <span className="text-green-400 text-sm">{item.hora_salida}</span>
                    ) : (
                      <span className="text-amber-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> En curso
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${!item.hora_salida ? 'text-amber-400' : 'text-green-400'}`}>
                      {calcularTiempo(item.hora_entrada, item.hora_salida)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => verDetalle(item)}
                        className="w-8 h-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => abrirConfirmar(item)}
                        className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {registrosFiltrados.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          {filtroFecha || busqueda ? "No hay registros con esos filtros" : "No hay registros de estacionamiento"}
        </div>
      )}

      <ModalDetalle
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        title="Detalle de estacionamiento"
        data={selectedItem}
        onDelete={() => {}}
        type="parking"
      />

      <ModalConfirmar
        isOpen={modalConfirmOpen}
        onClose={() => setModalConfirmOpen(false)}
        onConfirm={eliminarRegistro}
        title="Confirmar eliminación"
        message={`¿Estás seguro que deseas eliminar el registro del lugar ${itemToDelete?.lugar}?`}
      />
    </div>
  );
}