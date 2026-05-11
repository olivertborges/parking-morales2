// src/services/reportsService.js
import { supabase } from "./supabase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Obtener médicos sin tarjeta
export async function getMedicosSinTarjeta() {
  try {
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .not("sin_tarjeta_motivo", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo médicos sin tarjeta:", error);
    return [];
  }
}

// Obtener ingresos por día (últimos 30 días)
export async function getIngresosPorDia() {
  try {
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) throw error;

    // Agrupar por fecha
    const groupedByDate = {};
    (data || []).forEach(item => {
      if (!groupedByDate[item.fecha]) {
        groupedByDate[item.fecha] = {
          fecha: item.fecha,
          ingresos: 0,
          egresos: 0,
          pendientes: 0
        };
      }
      groupedByDate[item.fecha].ingresos++;
      if (item.hora_salida) {
        groupedByDate[item.fecha].egresos++;
      } else {
        groupedByDate[item.fecha].pendientes++;
      }
    });

    // Convertir a array y ordenar por fecha descendente
    return Object.values(groupedByDate).slice(0, 30);
  } catch (error) {
    console.error("Error obteniendo ingresos por día:", error);
    return [];
  }
}

// Exportar a Excel
export function exportToExcel(data, filename, sheetName = "Reporte") {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generar archivo y descargar
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("Error exportando a Excel:", error);
    return false;
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
    "Fecha": item.fecha,
    "Hora Entrada": item.hora_entrada,
    "Hora Salida": item.hora_salida || "En curso"
  }));
  
  return exportToExcel(formattedData, "medicos_sin_tarjeta", "Médicos sin tarjeta");
}

// Exportar ingresos por día
export async function exportIngresosPorDia() {
  const data = await getIngresosPorDia();
  
  const formattedData = data.map(item => ({
    "Fecha": item.fecha,
    "Ingresos": item.ingresos,
    "Egresos": item.egresos,
    "Pendientes": item.pendientes,
    "Saldo": item.ingresos - item.egresos
  }));
  
  return exportToExcel(formattedData, "ingresos_por_dia", "Ingresos por día");
}