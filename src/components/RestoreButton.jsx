// src/components/RestoreButton.jsx
import { useState, useRef } from "react";
import { Upload, AlertTriangle, CheckCircle, X } from "lucide-react";
import { restoreFromExcel } from "../services/restoreService";

export default function RestoreButton() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [restoreStatus, setRestoreStatus] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.name.endsWith('.xlsx'))) {
      setSelectedFile(file);
      setFileName(file.name);
      setShowConfirm(true);
      setRestoreStatus({ type: "", message: "" });
    } else {
      setRestoreStatus({ 
        type: "error", 
        message: "Por favor selecciona un archivo Excel válido (.xlsx)" 
      });
      setTimeout(() => setRestoreStatus({ type: "", message: "" }), 3000);
    }
    fileInputRef.current.value = "";
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setRestoreStatus({ type: "", message: "" });
    
    try {
      const response = await restoreFromExcel(selectedFile);
      
      if (response.success) {
        setRestoreStatus({ 
          type: "success", 
          message: "✅ Restauración completada exitosamente" 
        });
        setShowConfirm(false);
        setSelectedFile(null);
        setFileName("");
        
        // Recargar después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setRestoreStatus({ 
          type: "error", 
          message: `❌ Error: ${response.message}` 
        });
      }
    } catch (error) {
      console.error("Error en restauración:", error);
      setRestoreStatus({ 
        type: "error", 
        message: `❌ Error inesperado: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelRestore = () => {
    setShowConfirm(false);
    setSelectedFile(null);
    setFileName("");
  };

  return (
    <div className="w-full">
      <button
        onClick={() => fileInputRef.current.click()}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-300 text-sm font-medium disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        {loading ? "Restaurando..." : "Restaurar backup"}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-xl">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Restaurar datos</h3>
              <button 
                onClick={cancelRestore}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <p className="text-amber-400 text-sm font-medium">¡ADVERTENCIA!</p>
              </div>
              
              <p className="text-slate-300">
                ¿Estás seguro que deseas restaurar los datos desde el archivo?
              </p>
              
              {fileName && (
                <p className="text-xs text-slate-400 bg-slate-700/50 p-2 rounded">
                  📁 Archivo: <span className="text-white">{fileName}</span>
                </p>
              )}
              
              <p className="text-red-400 text-xs">
                ⚠️ Esta acción reemplazará TODOS los datos actuales en la base de datos.
              </p>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={cancelRestore} 
                  className="flex-1 py-2 border border-slate-600 rounded-xl text-white hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRestore} 
                  disabled={loading} 
                  className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-xl text-white font-medium transition disabled:opacity-50"
                >
                  {loading ? "Restaurando..." : "Confirmar restauración"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de estado */}
      {restoreStatus.message && (
        <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
          restoreStatus.type === "success" 
            ? "bg-green-500/10 border border-green-500/20 text-green-400" 
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {restoreStatus.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm">{restoreStatus.message}</span>
        </div>
      )}
    </div>
  );
}