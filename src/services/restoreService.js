// src/services/restoreService.js
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

export const restoreFromExcel = async (file) => {
  try {
    // Leer el archivo Excel
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    
    const tables = ["active_vehicles", "history", "doctors", "users", "parking_assignments", "parking_history"];
    
    for (const tableName of tables) {
      const sheet = workbook.Sheets[tableName];
      if (!sheet) {
        console.warn(`Hoja ${tableName} no encontrada en el archivo`);
        continue;
      }
      
      // Convertir hoja a JSON
      const records = XLSX.utils.sheet_to_json(sheet);
      
      if (records.length === 0) continue;
      
      // Limpiar tabla existente
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', 0); // Eliminar todos los registros
      
      if (deleteError) {
        console.error(`Error al limpiar ${tableName}:`, deleteError);
        continue;
      }
      
      // Insertar nuevos registros (en lotes de 100 para evitar problemas)
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(batch);
        
        if (insertError) {
          console.error(`Error al insertar en ${tableName}:`, insertError);
          throw insertError;
        }
      }
      
      console.log(`✅ Tabla ${tableName}: ${records.length} registros restaurados`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error en restoreFromExcel:", error);
    return { success: false, message: error.message };
  }
};