// src/components/BackupButton.jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import { Database } from "lucide-react";
import * as XLSX from "xlsx";

export default function BackupButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exportAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tables = ["active_vehicles", "history", "doctors", "users", "parking_assignments", "parking_history"];
      const allData = {};
      let hasData = false;

      console.log("Iniciando backup...");

      for (const table of tables) {
        console.log(`Consultando tabla: ${table}`);
        const { data, error } = await supabase.from(table).select("*");
        
        if (error) {
          console.error(`Error en tabla ${table}:`, error);
          // No detenemos el proceso, solo mostramos el error
          setError(prev => `Error en ${table}: ${error.message}\n${prev || ''}`);
        } else if (data && data.length > 0) {
          console.log(`Tabla ${table}: ${data.length} registros`);
          allData[table] = data;
          hasData = true;
        } else {
          console.log(`Tabla ${table}: sin datos`);
        }
      }

      if (!hasData) {
        setError("No se encontraron datos para exportar");
        setLoading(false);
        return;
      }

      // Crear libro de Excel
      const workbook = XLSX.utils.book_new();
      
      for (const [tableName, tableData] of Object.entries(allData)) {
        const worksheet = XLSX.utils.json_to_sheet(tableData);
        // Ajustar anchos de columnas (opcional)
        const cols = Object.keys(tableData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        worksheet['!cols'] = cols;
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName.substring(0, 31)); // Excel limita a 31 chars
      }

      // Generar y descargar el archivo
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `backup_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("Backup completado exitosamente:", fileName);
      
    } catch (error) {
      console.error("Error al exportar backup:", error);
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={exportAllData}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all duration-300 text-sm font-medium disabled:opacity-50"
      >
        <Database className="w-4 h-4" />
        {loading ? "Exportando..." : "Backup completo"}
      </button>
      
      {error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
          {error.split('\n').map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}
    </div>
  );
}