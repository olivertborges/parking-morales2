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

export async function getTotalesPorRango(fechaInicio, fechaFin) {
  try {
    const { data, error } = await supabase
      .from("history")
      .select("fecha, monto, tipo, hora_salida")
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        ingresos: 0,
        egresos: 0,
        pendientes: 0,
        saldo: 0
      };
    }

    let ingresos = 0;
    let egresos = 0;
    let pendientes = 0;

    data.forEach(item => {
      const monto = parseFloat(item.monto) || 0;
      
      if (item.tipo === "ingreso" || item.tipo === "pago") {
        ingresos += monto;
      } else if (item.tipo === "egreso" || item.tipo === "gasto") {
        egresos += monto;
      }

      // Pendientes = vehículos activos (sin hora_salida)
      if (!item.hora_salida || item.hora_salida === "") {
        pendientes++;
      }
    });

    return {
      ingresos: ingresos,
      egresos: egresos,
      pendientes: pendientes,
      saldo: ingresos - egresos
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      ingresos: 0,
      egresos: 0,
      pendientes: 0,
      saldo: 0
    };
  }
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