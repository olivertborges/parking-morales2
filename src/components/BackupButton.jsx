// src/components/BackupButton.jsx
import { useState } from "react";
import { supabase } from "../services/supabase";
import { Database } from "lucide-react";
import * as XLSX from "xlsx";

export default function BackupButton() {
  const [loading, setLoading] = useState(false);

  const exportAllData = async () => {
    setLoading(true);
    
    try {
      const tables = ["active_vehicles", "history", "doctors", "users", "parking_assignments", "parking_history"];
      const allData = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*");
        if (!error && data && data.length > 0) {
          allData[table] = data;
        }
      }

      const workbook = XLSX.utils.book_new();
      
      for (const [tableName, tableData] of Object.entries(allData)) {
        const worksheet = XLSX.utils.json_to_sheet(tableData);
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      }

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar backup:", error);
    }
    
    setLoading(false);
  };

  return (
    <button
      onClick={exportAllData}
      disabled={loading}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 transition-all duration-300 text-sm"
    >
      <Database className="w-4 h-4" />
      {loading ? "Exportando..." : "Backup completo"}
    </button>
  );
}