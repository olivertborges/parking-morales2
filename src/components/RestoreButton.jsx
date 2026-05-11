// src/components/RestoreButton.jsx
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { restoreFromExcel } from "../services/restoreService";

export default function RestoreButton() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.name.endsWith('.xlsx'))) {
      setSelectedFile(file);
      setShowConfirm(true);
    } else {
      alert("Por favor selecciona un archivo Excel válido (.xlsx)");
    }
    fileInputRef.current.value = "";
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    const response = await restoreFromExcel(selectedFile);
    
    if (response.success) {
      alert("Restauración completada exitosamente");
      setShowConfirm(false);
      setSelectedFile(null);
      window.location.reload();
    } else {
      alert("Error al restaurar: " + response.message);
    }
    
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => fileInputRef.current.click()}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 transition-all duration-300 text-sm"
      >
        <Upload className="w-4 h-4" />
        Restaurar backup
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30">
            <div className="p-5 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Restaurar datos</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300">¿Estás seguro que deseas restaurar los datos?</p>
              <p className="text-amber-400 text-xs">⚠️ Esto reemplazará los datos actuales</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 border border-slate-600 rounded-xl text-white">Cancelar</button>
                <button onClick={handleRestore} disabled={loading} className="flex-1 bg-blue-600 py-2 rounded-xl text-white">
                  {loading ? "Restaurando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}