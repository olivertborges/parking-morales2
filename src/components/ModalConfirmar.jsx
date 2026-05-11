// src/components/ModalConfirmar.jsx
import { X, AlertTriangle, Trash2 } from "lucide-react";

export default function ModalConfirmar({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-red-500/30 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-slate-300 text-center">{message}</p>
          <p className="text-red-400 text-xs text-center mt-2">⚠️ Esta acción no se puede deshacer</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white font-medium hover:bg-slate-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
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