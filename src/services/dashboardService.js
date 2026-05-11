// src/services/dashboardService.js
import { supabase } from "./supabase";

// Función para obtener estadísticas del dashboard
export async function getDashboardStats() {
  try {
    // Obtener vehículos activos
    const { data: activeVehicles, error: activeError } = await supabase
      .from("active_vehicles")
      .select("*");

    if (activeError) throw activeError;

    // Obtener historial de hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: todayHistory, error: historyError } = await supabase
      .from("history")
      .select("*")
      .eq("fecha", today);

    if (historyError) throw historyError;

    // Obtener total de médicos registrados
    const { count: totalMedicos, error: medicosError } = await supabase
      .from("doctors")
      .select("*", { count: "exact", head: true });

    if (medicosError) throw medicosError;

    // Obtener total de usuarios
    const { count: totalUsuarios, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (usersError) throw usersError;

    // Capacidades fijas
    const CAPACIDAD_MEDICOS = 33;
    const CAPACIDAD_JUNTA = 4;
    const CAPACIDAD_TOTAL = 37;

    // Calcular estadísticas
    const medicos = activeVehicles?.filter(v => v.tipo === "Medico").length || 0;
    const junta = activeVehicles?.filter(v => v.tipo === "Junta").length || 0;
    const reservas = activeVehicles?.filter(v => v.tipo === "Reserva").length || 0;
    const totalDentro = activeVehicles?.length || 0;
    const disponibles = CAPACIDAD_TOTAL - totalDentro;
    const ocupacionPorcentaje = Math.round((totalDentro / CAPACIDAD_TOTAL) * 100);
    
    // Ingresos y egresos de hoy
    const ingresosHoy = todayHistory?.filter(h => h.hora_entrada).length || 0;
    const egresosHoy = todayHistory?.filter(h => h.hora_salida).length || 0;
    const rotacionPromedio = ingresosHoy + egresosHoy;

    return {
      medicos,
      junta,
      reservas,
      totalDentro,
      disponibles,
      ocupacionPorcentaje,
      capacidadMedicos: CAPACIDAD_MEDICOS,
      capacidadJunta: CAPACIDAD_JUNTA,
      capacidadTotal: CAPACIDAD_TOTAL,
      plazasOcupadas: 0,
      totalMedicos: totalMedicos || 0,
      totalUsuarios: totalUsuarios || 0,
      ingresosHoy,
      egresosHoy,
      rotacionPromedio,
      alertaCritica: totalDentro >= CAPACIDAD_TOTAL * 0.9
    };
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    return {
      medicos: 0,
      junta: 0,
      reservas: 0,
      totalDentro: 0,
      disponibles: 37,
      ocupacionPorcentaje: 0,
      capacidadMedicos: 33,
      capacidadJunta: 4,
      capacidadTotal: 37,
      plazasOcupadas: 0,
      totalMedicos: 0,
      totalUsuarios: 0,
      ingresosHoy: 0,
      egresosHoy: 0,
      rotacionPromedio: 0,
      alertaCritica: false
    };
  }
}

// Función para obtener datos de ocupación por hora
export async function getOccupancyByHour() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("history")
      .select("hora_entrada")
      .eq("fecha", today);

    if (error) throw error;

    // Inicializar array de 24 horas
    const hourlyData = Array(24).fill(0);
    
    if (data && data.length > 0) {
      data.forEach(record => {
        if (record.hora_entrada) {
          const hour = parseInt(record.hora_entrada.split(':')[0]);
          if (hour >= 0 && hour < 24) {
            hourlyData[hour]++;
          }
        }
      });
    }

    return hourlyData;
  } catch (error) {
    console.error("Error obteniendo datos por hora:", error);
    return Array(24).fill(0);
  }
}

// Función para obtener predicción
export async function getPrediction() {
  try {
    // Obtener datos de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fechaInicio = sevenDaysAgo.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("history")
      .select("fecha")
      .gte("fecha", fechaInicio);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { texto: "Datos insuficientes para predecir", nivel: "media" };
    }

    // Agrupar por día
    const dailyCount = {};
    data.forEach(record => {
      dailyCount[record.fecha] = (dailyCount[record.fecha] || 0) + 1;
    });

    const valores = Object.values(dailyCount);
    const avgDaily = valores.reduce((a, b) => a + b, 0) / valores.length;
    
    if (avgDaily > 30) {
      return { texto: "Alta afluencia esperada ⚠️", nivel: "alta" };
    } else if (avgDaily > 15) {
      return { texto: "Afluencia moderada 📊", nivel: "media" };
    } else {
      return { texto: "Baja afluencia estimada ✅", nivel: "baja" };
    }
  } catch (error) {
    console.error("Error obteniendo predicción:", error);
    return { texto: "Datos insuficientes para predecir", nivel: "media" };
  }
}