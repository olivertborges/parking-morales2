// src/services/usersService.js
import { supabase } from "./supabase";

// Obtener todos los usuarios
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return [];
  }
}

// Obtener un usuario por ID
export async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return null;
  }
}

// Crear un nuevo usuario
// src/services/usersService.js

// Crear usuario
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert({
        usuario: userData.usuario,  // 👈 NUEVO
        nombre: userData.nombre,
        email: userData.email,
        password: userData.password, // Recuerda hashear en producción
        rol: userData.rol
      })
      .select();
    
    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Actualizar usuario
export const updateUser = async (id, userData) => {
  try {
    const updateData = {
      usuario: userData.usuario,  // 👈 NUEVO
      nombre: userData.nombre,
      email: userData.email,
      rol: userData.rol
    };
    
    if (userData.password) {
      updateData.password = userData.password;
    }
    
    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Eliminar un usuario
export async function deleteUser(id) {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return { success: false, error: error.message };
  }
}

// Buscar usuarios por nombre o email
export async function searchUsers(searchTerm) {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .order("nombre", { ascending: true });

    if (searchTerm && searchTerm.trim()) {
      query = query.or(`nombre.ilike.%${searchTerm.trim()}%,email.ilike.%${searchTerm.trim()}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error buscando usuarios:", error);
    return [];
  }
}