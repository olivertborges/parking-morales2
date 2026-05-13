// src/services/reservasService.js
import { supabase } from "./supabase";

// Obtener reservas del día
export async function getReservasDelDia(fecha) {
  try {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("fecha", fecha)
      .eq("estado", "pendiente")
      .order("hora", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    return [];
  }
}

// Agregar nueva reserva
export async function agregarReserva(reserva) {
  try {
    const { error } = await supabase
      .from("reservas")
      .insert([{
        nombre: reserva.nombre,
        matricula: reserva.matricula.toUpperCase(),
        lugar: reserva.lugar || null,
        hora: reserva.hora,
        fecha: reserva.fecha,
        estado: "pendiente"
      }]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error agregando reserva:", error);
    return { success: false, error: error.message };
  }
}

// Marcar reserva como completada (ya llegó)
export async function completarReserva(id) {
  try {
    const { error } = await supabase
      .from("reservas")
      .update({ estado: "completada" })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error completando reserva:", error);
    return { success: false, error: error.message };
  }
}

// Eliminar reserva (cancelada)
export async function eliminarReserva(id) {
  try {
    const { error } = await supabase
      .from("reservas")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error eliminando reserva:", error);
    return { success: false, error: error.message };
  }
}