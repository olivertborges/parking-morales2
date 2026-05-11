// src/pages/logs/LogsPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Activity, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarLogs();
  }, []);

  async function cargarLogs() {
    const { data } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  }

  async function limpiarLogs() {
    if (confirm("¿Eliminar todos los logs?")) {
      const { error } = await supabase.from("logs").delete().neq("id", 0);
      if (error) {
        toast.error("Error al limpiar logs");
      } else {
        toast.success("Logs eliminados");
        cargarLogs();
      }
    }
  }

  if (loading) {
    return <div className="text-white p-4">Cargando logs...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Logs del Sistema</h1>
        <button
          onClick={limpiarLogs}
          className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar logs
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left text-slate-300">Fecha</th>
                <th className="p-3 text-left text-slate-300">Usuario</th>
                <th className="p-3 text-left text-slate-300">Acción</th>
                <th className="p-3 text-left text-slate-300">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-800">
                  <td className="p-3 text-slate-400 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-white text-sm">{log.usuario}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      {log.accion}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 text-sm">{log.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs.length === 0 && (
        <div className="text-center text-slate-400 py-8">No hay logs registrados</div>
      )}
    </div>
  );
}