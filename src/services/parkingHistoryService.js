// src/services/parkingHistoryService.js
import { supabase } from "./supabase";

// Obtener todo el historial de estacionamiento
export async function getParkingHistory({ searchTerm = "", filterDate = "", limit = 20, offset = 0 } = {}) {
  try {
    let query = supabase
      .from("parking_history")
      .select("*", { count: "exact" })
      .order("fecha_entrada", { ascending: false })
      .order("hora_entrada", { ascending: false });

    if (searchTerm && searchTerm.trim()) {
      query = query.or(`medico_nombre.ilike.%${searchTerm.trim()}%,medico_matricula.ilike.%${searchTerm.trim()}%,lugar.ilike.%${searchTerm.trim()}%`);
    }

    if (filterDate) {
      query = query.eq("fecha_entrada", filterDate);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error("Error obteniendo historial de estacionamiento:", error);
    return { data: [], total: 0 };
  }
}

// Obtener estadísticas del historial de estacionamiento
export async function getParkingHistoryStats() {
  try {
    // Total de registros
    const { count: total, error: totalError } = await supabase
      .from("parking_history")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    // Registros activos (sin fecha de salida)
    const { count: activos, error: activosError } = await supabase
      .from("parking_history")
      .select("*", { count: "exact", head: true })
      .is("fecha_salida", null);

    if (activosError) throw activosError;

    // Lugares más usados
    const { data: lugares, error: lugaresError } = await supabase
      .from("parking_history")
      .select("lugar")
      .not("lugar", "is", null);

    if (lugaresError) throw lugaresError;

    const lugaresCount = {};
    lugares?.forEach(item => {
      lugaresCount[item.lugar] = (lugaresCount[item.lugar] || 0) + 1;
    });

    const topLugares = Object.entries(lugaresCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lugar, count]) => ({ lugar, count }));

    return {
      total: total || 0,
      activos: activos || 0,
      topLugares
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { total: 0, activos: 0, topLugares: [] };
  }
}

// Exportar historial a Excel
export async function exportParkingHistoryToExcel(filters = {}) {
  try {
    let query = supabase
      .from("parking_history")
      .select("*")
      .order("fecha_entrada", { ascending: false });

    if (filters.searchTerm) {
      query = query.or(`medico_nombre.ilike.%${filters.searchTerm}%,medico_matricula.ilike.%${filters.searchTerm}%,lugar.ilike.%${filters.searchTerm}%`);
    }

    if (filters.filterDate) {
      query = query.eq("fecha_entrada", filters.filterDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error exportando historial:", error);
    return [];
  }
}