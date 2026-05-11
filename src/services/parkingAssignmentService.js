// src/services/parkingAssignmentService.js
import { supabase } from "./supabase";

// Obtener todas las asignaciones de parking
export async function getParkingAssignments() {
  try {
    // Primero, asegurarnos de que los lugares existan
    await initializeParkingSpots();
    
    const { data, error } = await supabase
      .from("parking_assignments")
      .select("*")
      .order("lugar");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo asignaciones:", error);
    return [];
  }
}

// Asignar un lugar a un vehículo/médico
export async function assignParkingSpot(spotId, vehicleId, medicoNombre, medicoMatricula) {
  try {
    // Verificar si el lugar ya está ocupado
    const { data: spot, error: checkError } = await supabase
      .from("parking_assignments")
      .select("activo")
      .eq("id", spotId)
      .single();

    if (checkError) throw checkError;
    
    if (spot.activo) {
      return { success: false, error: "El lugar ya está ocupado" };
    }

    // Actualizar el lugar como ocupado
    const { error: updateError } = await supabase
      .from("parking_assignments")
      .update({
        activo: true,
        vehiculo_id: vehicleId,
        medico_nombre: medicoNombre,
        medico_matricula: medicoMatricula,
        fecha_asignacion: new Date().toISOString().split('T')[0],
        hora_asignacion: new Date().toLocaleTimeString('es-AR'),
        updated_at: new Date().toISOString()
      })
      .eq("id", spotId);

    if (updateError) throw updateError;

    // Registrar en parking_history
    const { error: historyError } = await supabase
      .from("parking_history")
      .insert({
        lugar: spotId,
        vehiculo_id: vehicleId,
        medico_nombre: medicoNombre,
        medico_matricula: medicoMatricula,
        fecha_entrada: new Date().toISOString().split('T')[0],
        hora_entrada: new Date().toLocaleTimeString('es-AR'),
        created_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    return { success: true };
  } catch (error) {
    console.error("Error asignando lugar:", error);
    return { success: false, error: error.message };
  }
}

// Liberar un lugar ocupado
export async function freeParkingSpot(spotId) {
  try {
    // Obtener la asignación actual
    const { data: assignment, error: getError } = await supabase
      .from("parking_assignments")
      .select("*")
      .eq("id", spotId)
      .single();

    if (getError) throw getError;

    if (!assignment.activo) {
      return { success: false, error: "El lugar ya está libre" };
    }

    // Actualizar parking_history con la salida
    const { error: updateHistoryError } = await supabase
      .from("parking_history")
      .update({
        fecha_salida: new Date().toISOString().split('T')[0],
        hora_salida: new Date().toLocaleTimeString('es-AR')
      })
      .eq("lugar", spotId)
      .eq("medico_nombre", assignment.medico_nombre)
      .is("fecha_salida", null);

    if (updateHistoryError) throw updateHistoryError;

    // Liberar el lugar
    const { error: updateError } = await supabase
      .from("parking_assignments")
      .update({
        activo: false,
        vehiculo_id: null,
        medico_nombre: null,
        medico_matricula: null,
        fecha_asignacion: null,
        hora_asignacion: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", spotId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error("Error liberando lugar:", error);
    return { success: false, error: error.message };
  }
}

// Inicializar los lugares de parking (S1-S12, Z1-Z12, W1-W8, T1-T3, X, Y)
async function initializeParkingSpots() {
  try {
    // Verificar si ya existen lugares
    const { count, error: countError } = await supabase
      .from("parking_assignments")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;
    
    // Si ya hay lugares, no hacer nada
    if (count > 0) return;

    const spots = [];
    
    // S1 a S12
    for (let i = 1; i <= 12; i++) spots.push({ lugar: `S${i}`, activo: false });
    // Z1 a Z12
    for (let i = 1; i <= 12; i++) spots.push({ lugar: `Z${i}`, activo: false });
    // W1 a W8
    for (let i = 1; i <= 8; i++) spots.push({ lugar: `W${i}`, activo: false });
    // T1 a T3
    for (let i = 1; i <= 3; i++) spots.push({ lugar: `T${i}`, activo: false });
    // X, Y
    spots.push({ lugar: "X", activo: false });
    spots.push({ lugar: "Y", activo: false });

    const { error: insertError } = await supabase
      .from("parking_assignments")
      .insert(spots);
      
    if (insertError) throw insertError;
    
    console.log("Lugares de parking inicializados");
  } catch (error) {
    console.error("Error inicializando lugares:", error);
  }
}