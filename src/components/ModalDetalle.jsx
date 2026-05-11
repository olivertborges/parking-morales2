// src/components/ModalDetalle.jsx
import { X, Trash2, Eye, Clock, MapPin, User, Car, Calendar } from "lucide-react";

export default function ModalDetalle({ isOpen, onClose, title, data, onDelete, type }) {
  if (!isOpen || !data) return null;

  const handleDelete = () => {
    if (confirm(`¿Eliminar este registro?`)) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {type === "history" ? (
            // Historial de movimientos
            <>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">Nombre</span>
                </div>
                <p className="text-white font-semibold">{data.nombre}</p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">Matrícula</span>
                </div>
                <p className="text-white font-mono">{data.matricula}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400 text-sm">Entrada</span>
                  </div>
                  <p className="text-white">{data.hora_entrada}</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400 text-sm">Salida</span>
                  </div>
                  <p className="text-green-400">{data.hora_salida || "En curso"}</p>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">Fecha</span>
                </div>
                <p className="text-white">{data.fecha}</p>
              </div>

              {data.tipo && (
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    data.tipo === "Medico" ? "bg-blue-500/20 text-blue-400" :
                    data.tipo === "Junta" ? "bg-purple-500/20 text-purple-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {data.tipo}
                  </span>
                </div>
              )}
            </>
          ) : (
            // Historial de estacionamiento (parking)
            <>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">Lugar</span>
                </div>
                <p className="text-white font-bold text-xl">{data.lugar}</p>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-sm">Médico</span>
                </div>
                <p className="text-white font-semibold">{data.medico_nombre}</p>
                <p className="text-slate-400 text-sm mt-1">{data.medico_matricula}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400 text-sm">Fecha Entrada</span>
                  </div>
                  <p className="text-white">{data.fecha_entrada}</p>
                  <p className="text-slate-300 text-sm">{data.hora_entrada}</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400 text-sm">Fecha Salida</span>
                  </div>
                  <p className="text-white">{data.fecha_salida || "—"}</p>
                  <p className="text-green-400 text-sm">{data.hora_salida || "En curso"}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white font-medium hover:bg-slate-700 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 py-2.5 rounded-xl font-semibold text-white hover:from-red-700 hover:to-red-800 transition flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}