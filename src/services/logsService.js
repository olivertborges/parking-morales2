// src/services/logsService.js
import { supabase } from "./supabase";

export async function addLog(usuario, accion, detalle, ip = null) {
  try {
    // Asegurar que todos los campos existen en la tabla
    const logToInsert = {
      usuario: usuario || "Sistema",
      accion: accion || "ACCION_DESCONOCIDA",
      detalle: detalle || "",
      created_at: new Date().toISOString()
    };
    
    // Solo agregar IP si la columna existe y hay valor
    if (ip) {
      logToInsert.ip = ip;
    }
    
    console.log("📝 Guardando log:", logToInsert);
    
    const { error } = await supabase
      .from("logs")
      .insert([logToInsert]);

    if (error) {
      console.error("Error guardando log:", error);
    }
  } catch (error) {
    console.error("Error en addLog:", error);
  }
}

async function getClientIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return "desconocida";
  }
}

export async function getLogs(limit = 100) {
  const { data } = await supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}