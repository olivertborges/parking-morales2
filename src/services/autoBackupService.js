// src/services/autoBackupService.js
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

// Función principal para ejecutar backup automático
export async function scheduleAutoBackup() {
  // Verificar si ya se hizo backup hoy
  const lastBackup = localStorage.getItem("lastAutoBackup");
  const today = new Date().toISOString().split('T')[0];
  
  // Si no se hizo backup hoy, ejecutar
  if (lastBackup !== today) {
    console.log("🔄 Ejecutando backup automático...");
    await performAutoBackup();
    localStorage.setItem("lastAutoBackup", today);
    console.log("✅ Backup automático completado");
  }
}

// Función que realiza el backup
async function performAutoBackup() {
  try {
    // Tablas a respaldar
    const tables = ["active_vehicles", "history", "doctors", "users", "parking_assignments", "parking_history"];
    const allData = {};

    // Obtener datos de cada tabla
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*");
      if (!error && data && data.length > 0) {
        allData[table] = data;
      }
    }

    // Crear archivo Excel
    const workbook = XLSX.utils.book_new();
    for (const [tableName, tableData] of Object.entries(allData)) {
      const worksheet = XLSX.utils.json_to_sheet(tableData);
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
    }

    // Convertir a blob y guardar en localStorage
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    // Guardar como base64 en localStorage
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(`backup_${new Date().toISOString().split('T')[0]}`, reader.result);
      // Limpiar backups viejos (mayores a 30 días)
      cleanOldBackups();
    };
    reader.readAsDataURL(blob);
    
  } catch (error) {
    console.error("Error en backup automático:", error);
  }
}

// Limpiar backups antiguos (más de 30 días)
function cleanOldBackups() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("backup_")) {
      const backupDate = key.replace("backup_", "");
      if (new Date(backupDate) < thirtyDaysAgo) {
        localStorage.removeItem(key);
        console.log(`🗑️ Backup antiguo eliminado: ${key}`);
      }
    }
  }
}

// Función para restaurar un backup desde localStorage
export function restoreBackupFromLocal(date) {
  const backupData = localStorage.getItem(`backup_${date}`);
  if (backupData) {
    // Convertir base64 a blob y descargar
    const link = document.createElement("a");
    link.href = backupData;
    link.download = `backup_${date}.xlsx`;
    link.click();
    return true;
  }
  return false;
}

// Obtener lista de backups disponibles
export function getAvailableBackups() {
  const backups = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("backup_")) {
      backups.push(key.replace("backup_", ""));
    }
  }
  return backups.sort().reverse();
}