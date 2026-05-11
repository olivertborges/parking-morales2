// src/services/restoreService.js
import { supabase } from "./supabase";

// Restaurar datos desde un archivo Excel
export async function restoreFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const results = {};
        const errors = [];
        
        // Procesar cada hoja del Excel
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) continue;
          
          // Verificar que la tabla existe
          const validTables = ["active_vehicles", "history", "doctors", "users", "parking_assignments", "parking_history"];
          
          if (!validTables.includes(sheetName)) {
            errors.push(`Hoja "${sheetName}" no es una tabla válida`);
            continue;
          }
          
          // Limpiar la tabla antes de restaurar (opcional - comentado por seguridad)
          // const { error: clearError } = await supabase.from(sheetName).delete().neq("id", 0);
          // if (clearError) errors.push(`Error limpiando ${sheetName}: ${clearError.message}`);
          
          // Insertar datos
          const { error: insertError } = await supabase
            .from(sheetName)
            .upsert(jsonData, { onConflict: 'id' });
          
          if (insertError) {
            errors.push(`Error restaurando ${sheetName}: ${insertError.message}`);
          } else {
            results[sheetName] = jsonData.length;
          }
        }
        
        resolve({ success: true, results, errors });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error leyendo el archivo"));
    reader.readAsArrayBuffer(file);
  });
}

// Verificar si hay datos en una tabla
export async function checkTableData(tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  
  if (error) return 0;
  return count || 0;
}