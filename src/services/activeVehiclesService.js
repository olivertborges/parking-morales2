// src/services/activeVehiclesService.js
import { supabase } from "./supabase";

// Obtener todos los vehículos activos
export async function getActiveVehicles() {
  try {
    const { data, error } = await supabase
      .from("active_vehicles")
      .select("*")
      .order("entrada_timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo vehículos activos:", error);
    return [];
  }
}

// Dar salida a un vehículo
export async function exitVehicle(vehicleId, vehicleNombre, vehicleMatricula) {
  try {
    // 1. Obtener datos completos del vehículo
    const { data: vehicle, error: getError } = await supabase
      .from("active_vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (getError) throw getError;

    // 2. Eliminar de active_vehicles
    const { error: deleteError } = await supabase
      .from("active_vehicles")
      .delete()
      .eq("id", vehicleId);

    if (deleteError) throw deleteError;

    // 3. Actualizar history con hora de salida
    const horaSalida = new Date().toLocaleTimeString('es-AR');
    const { error: updateError } = await supabase
      .from("history")
      .update({ 
        hora_salida: horaSalida
      })
      .eq("nombre", vehicle.nombre)
      .eq("matricula", vehicle.matricula)
      .is("hora_salida", null);

    if (updateError) console.error("Error actualizando history:", updateError);

    // 4. Si el vehículo tenía lugar asignado en parking_assignments, liberarlo
    const { error: parkingError } = await supabase
      .from("parking_assignments")
      .update({
        activo: false,
        vehiculo_id: null,
        medico_nombre: null,
        medico_matricula: null,
        tipo_medico: null
      })
      .eq("vehiculo_id", vehicleId);

    if (parkingError) console.error("Error liberando lugar:", parkingError);

    return { success: true };
  } catch (error) {
    console.error("Error dando salida:", error);
    return { success: false, error: error.message };
  }
}