// src/services/doctorsService.js
import { supabase } from "./supabase";

// Obtener todos los médicos
export async function getDoctors() {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo médicos:", error);
    return [];
  }
}

// Obtener un médico por ID
export async function getDoctorById(id) {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error obteniendo médico:", error);
    return null;
  }
}

// Crear un nuevo médico
export async function createDoctor(doctorData) {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .insert([{
        nombre: doctorData.nombre,
        matricula: doctorData.matricula.toUpperCase(),
        modelo: doctorData.modelo,
        color: doctorData.color,
        especialidad: doctorData.especialidad,
        telefono: doctorData.telefono,
        email: doctorData.email,
        activo: true,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creando médico:", error);
    return { success: false, error: error.message };
  }
}

// Actualizar un médico existente
export async function updateDoctor(id, doctorData) {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .update({
        nombre: doctorData.nombre,
        matricula: doctorData.matricula?.toUpperCase(),
        modelo: doctorData.modelo,
        color: doctorData.color,
        especialidad: doctorData.especialidad,
        telefono: doctorData.telefono,
        email: doctorData.email,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error actualizando médico:", error);
    return { success: false, error: error.message };
  }
}

// Eliminar un médico
export async function deleteDoctor(id) {
  try {
    const { error } = await supabase
      .from("doctors")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error eliminando médico:", error);
    return { success: false, error: error.message };
  }
}

// Buscar médicos por nombre o matrícula
export async function searchDoctors(searchTerm) {
  try {
    let query = supabase
      .from("doctors")
      .select("*")
      .order("nombre", { ascending: true });

    if (searchTerm) {
      query = query.or(`nombre.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error buscando médicos:", error);
    return [];
  }
}