// src/services/reportsService.js
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

// Función para formatear fecha a DD/MM/YYYY
const formatFecha = (fecha) => {
  if (!fecha) return "-";
  if (fecha.includes("-")) {
    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  }
  if (fecha.includes("/")) {
    return fecha;
  }
  return fecha;
};

// Función para exportar a Excel
function exportToExcel(data, filename, sheetName = "Reporte") {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("Error exportando a Excel:", error);
    return false;
  }
}

// Obtener médicos sin tarjeta
export async function getMedicosSinTarjeta() {
  try {
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .not("sin_tarjeta_motivo", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item,
      fecha: formatFecha(item.fecha)
    }));
  } catch (error) {
    console.error("Error obteniendo médicos sin tarjeta:", error);
    return [];
  }
}

export async function getIngresosPorDia(fechaInicio, fechaFin) {
  try {
    let query = supabase.from("history").select("*");
    
    if (fechaInicio && fechaFin) {
      // Convertir formato DD/MM/YYYY a YYYY-MM-DD si es necesario
      const inicio = fechaInicio.includes("/") 
        ? fechaInicio.split("/").reverse().join("-")
        : fechaInicio;
      const fin = fechaFin.includes("/")
        ? fechaFin.split("/").reverse().join("-")
        : fechaFin;
      
      query = query.gte("fecha", inicio).lte("fecha", fin);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    const groupedByDate = {};
    
    data.forEach(item => {
      // Normalizar fecha
      let fechaKey = item.fecha;
      if (fechaKey && fechaKey.includes("/")) {
        const [day, month, year] = fechaKey.split("/");
        fechaKey = `${year}-${month}-${day}`;
      }
      
      if (!groupedByDate[fechaKey]) {
        groupedByDate[fechaKey] = {
          fecha: fechaKey,
          ingresos: 0,      // Total de VEHÍCULOS que entraron
          egresos: 0,       // Total de VEHÍCULOS que salieron
          pendiente: 0      // Vehículos que siguen adentro
        };
      }
      
      // CONTAR 1 por cada entrada (sin importar montos)
      groupedByDate[fechaKey].ingresos++;
      
      // Si tiene hora de salida, contar como egreso
      if (item.hora_salida && item.hora_salida !== "") {
        groupedByDate[fechaKey].egresos++;
      } else {
        // Si no tiene hora de salida, está pendiente
        groupedByDate[fechaKey].pendiente++;
      }
    });
    
    // Calcular pendiente real (ingresos - egresos)
    Object.values(groupedByDate).forEach(dia => {
      dia.pendiente = dia.ingresos - dia.egresos;
    });
    
    return Object.values(groupedByDate);
    
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Función para obtener totales
export async function getTotalesRango(fechaInicio, fechaFin) {
  const datos = await getIngresosPorDia(fechaInicio, fechaFin);
  
  let totalIngresos = 0;
  let totalEgresos = 0;
  let totalPendientes = 0;
  
  datos.forEach(dia => {
    totalIngresos += dia.ingresos;
    totalEgresos += dia.egresos;
    totalPendientes += dia.pendiente;
  });
  
  return {
    ingresos: totalIngresos,
    egresos: totalEgresos,
    pendientes: totalPendientes,
    saldo: totalIngresos - totalEgresos
  };
}

// Exportar médicos sin tarjeta
export async function exportMedicosSinTarjeta() {
  const data = await getMedicosSinTarjeta();
  
  const formattedData = data.map(item => ({
    "Nombre": item.nombre,
    "Matrícula": item.matricula,
    "Tipo": item.tipo,
    "Motivo": item.sin_tarjeta_motivo,
    "Observaciones": item.sin_tarjeta_obs || "",
    "Fecha": formatFecha(item.fecha),
    "Hora Entrada": item.hora_entrada,
    "Hora Salida": item.hora_salida || "En curso"
  }));
  
  return exportToExcel(formattedData, "medicos_sin_tarjeta", "Médicos sin tarjeta");
}

// Exportar ingresos por día
export async function exportIngresosPorDia(data) {
  if (!data || data.length === 0) {
    console.log("No hay datos para exportar");
    return false;
  }
  
  const formattedData = data.map(item => ({
    "Fecha": formatFecha(item.fecha),
    "Ingresos": item.ingresos,
    "Egresos": item.egresos,
    "Pendientes": item.pendientes,
    "Saldo": item.ingresos - item.egresos
  }));
  
  return exportToExcel(formattedData, "ingresos_por_dia", "Ingresos por día");
}