// src/services/historyService.js
import { supabase } from "./supabase";

// Obtener todo el historial con opciones de filtro
export async function getHistory({ searchTerm = "", filterDate = "", limit = 100, offset = 0 } = {}) {
  try {
    let query = supabase
      .from("history")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Aplicar filtro de búsqueda por nombre o matrícula
    if (searchTerm) {
      query = query.or(`nombre.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`);
    }

    // Aplicar filtro de fecha
    if (filterDate) {
      query = query.eq("fecha", filterDate);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return { data: [], total: 0 };
  }
}

// Obtener estadísticas del historial
export async function getHistoryStats() {
  try {
    // Total de registros
    const { count: total, error: totalError } = await supabase
      .from("history")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    // Registros de hoy
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount, error: todayError } = await supabase
      .from("history")
      .select("*", { count: "exact", head: true })
      .eq("fecha", today);

    if (todayError) throw todayError;

    // Fechas extremas
    const { data: dates, error: datesError } = await supabase
      .from("history")
      .select("fecha")
      .order("fecha", { ascending: true })
      .limit(1);

    if (datesError) throw datesError;

    const { data: latestDates, error: latestError } = await supabase
      .from("history")
      .select("fecha")
      .order("fecha", { ascending: false })
      .limit(1);

    if (latestError) throw latestError;

    return {
      total: total || 0,
      today: todayCount || 0,
      oldestDate: dates?.[0]?.fecha || null,
      latestDate: latestDates?.[0]?.fecha || null
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { total: 0, today: 0, oldestDate: null, latestDate: null };
  }
}

// Limpiar todo el historial
export async function clearHistory() {
  try {
    const { error } = await supabase
      .from("history")
      .delete()
      .neq("id", 0);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error limpiando historial:", error);
    return { success: false, error: error.message };
  }
}

// Exportar historial a CSV
// src/services/historyService.js

export async function getHistory({ searchTerm = "", filterDate = "", limit = 100, offset = 0 } = {}) {
  try {
    let query = supabase
      .from("history")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false }); // 👈 Orden correcto

    if (searchTerm) {
      query = query.or(`nombre.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`);
    }

    if (filterDate) {
      query = query.eq("fecha", filterDate);
    }

    const from = offset;
    const to = offset + limit - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error en getHistory:", error);
      return { data: [], total: 0 };
    }
    
    console.log("📋 Registros encontrados:", data?.length);
    console.log("📋 Con salida:", data?.filter(h => h.hora_salida).length);
    
    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error("Error:", error);
    return { data: [], total: 0 };
  }
}