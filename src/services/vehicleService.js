// src/services/vehicleService.js
import { supabase } from "./supabase";

// Registrar un nuevo vehículo
export async function registerVehicle(vehicleData) {
  try {
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    const horaActual = new Date().toLocaleTimeString('es-AR', { hour12: false });
    const horaEntrada = vehicleData.hora_entrada || horaActual;
    const timestamp = ahora.toISOString();

    // 1. Insertar en active_vehicles
    const { error: errorActive } = await supabase
      .from("active_vehicles")
      .insert([{
        nombre: vehicleData.nombre,
        tipo: vehicleData.tipo,
        matricula: vehicleData.matricula.toUpperCase(),
        hora_entrada: horaEntrada,
        fecha_entrada: hoy,
        entrada_timestamp: timestamp,
        sin_tarjeta: vehicleData.sin_tarjeta || false,
        sin_tarjeta_motivo: vehicleData.sin_tarjeta ? vehicleData.motivo : null,
        sin_tarjeta_obs: vehicleData.sin_tarjeta ? vehicleData.observaciones : null,
        created_at: timestamp
      }]);

    if (errorActive) {
      return { success: false, error: errorActive.message };
    }

    // 2. Insertar en history
    const { error: errorHistory } = await supabase
      .from("history")
      .insert([{
        nombre: vehicleData.nombre,
        tipo: vehicleData.tipo,
        matricula: vehicleData.matricula.toUpperCase(),
        hora_entrada: horaEntrada,
        fecha: hoy,
        sin_tarjeta_motivo: vehicleData.sin_tarjeta ? vehicleData.motivo : null,
        sin_tarjeta_obs: vehicleData.sin_tarjeta ? vehicleData.observaciones : null,
        created_at: timestamp
      }]);

    if (errorHistory) {
      return { success: false, error: errorHistory.message };
    }

    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Dar salida a un vehículo
export async function exitVehicle(vehicleId, vehicleNombre, vehicleMatricula) {
  try {
    const horaActual = new Date().toLocaleTimeString('es-AR', { hour12: false });

    // 1. Actualizar history
    const { error: updateError } = await supabase
      .from("history")
      .update({ hora_salida: horaSalida })
      .eq("nombre", vehicleNombre)
      .eq("matricula", vehicleMatricula)
      .is("hora_salida", null);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Eliminar de active_vehicles
    const { error: deleteError } = await supabase
      .from("active_vehicles")
      .delete()
      .eq("id", vehicleId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Obtener vehículos activos
export async function getActiveVehicles() {
  try {
    const { data, error } = await supabase
      .from("active_vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}