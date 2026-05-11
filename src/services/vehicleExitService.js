import { supabase } from "./supabase";

export async function exitVehicle(vehicle) {
  try {
    const horaSalida = new Date()
      .toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
      });

    const fechaActual = new Date()
      .toLocaleDateString("es-UY");

    const { error: historyError } =
      await supabase
        .from("history")
        .insert([
          {
            nombre: vehicle.nombre,
            tipo: vehicle.tipo,
            matricula: vehicle.matricula,
            hora_entrada:
              vehicle.hora_entrada,
            hora_salida: horaSalida,
            fecha: fechaActual,
            sin_tarjeta_motivo:
              vehicle.sin_tarjeta_motivo,
            sin_tarjeta_obs:
              vehicle.sin_tarjeta_obs,
          },
        ]);

    if (historyError) throw historyError;

    const { error: deleteError } =
      await supabase
        .from("active_vehicles")
        .delete()
        .eq("id", vehicle.id);

    if (deleteError) throw deleteError;

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error,
    };
  }
}