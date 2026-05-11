import { supabase } from "./supabase";

export async function getParkingAssignments() {

  const { data, error } =
    await supabase
      .from("parking_assignments")
      .select("*")
      .order("lugar");

  if (error) {
    console.log(error);

    return [];
  }

  return data;
}

export async function assignParkingSpot({
  spotId,
  vehicleId,
  nombre,
  matricula,
}) {

  const { error } = await supabase
    .from("parking_assignments")
    .update({
      activo: true,
      medico_nombre: nombre,
      medico_matricula: matricula,
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
  };
}

export async function releaseParkingSpot(id) {

  const { error } = await supabase
    .from("parking_assignments")
    .update({
      activo: false,
      medico_nombre: null,
      medico_matricula: null,
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
  };
}

export async function getVehiclesWithoutSpot() {

  const { data, error } = await supabase
    .from("active_vehicles")
    .select("*")
    .is("parking_spot", null);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}