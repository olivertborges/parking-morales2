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
export async function createUser(userData) {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([{
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol,
        password: userData.password, // En producción, debería estar hasheada
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error creando usuario:", error);
    return { success: false, error: error.message };
  }
}

// Actualizar un usuario existente
export async function updateUser(id, userData) {
  try {
    const updateData = {
      nombre: userData.nombre,
      email: userData.email,
      rol: userData.rol,
      updated_at: new Date().toISOString()
    };
    
    // Solo actualizar contraseña si se proporcionó una nueva
    if (userData.password && userData.password.trim() !== "") {
      updateData.password = userData.password;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { success: false, error: error.message };
  }
}

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