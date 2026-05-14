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
    // Construir consulta base
    let query = supabase
      .from("history")
      .select("*");

    // Filtrar por rango de fechas si se proporcionan
    if (fechaInicio && fechaFin) {
      query = query
        .gte("fecha", fechaInicio)
        .lte("fecha", fechaFin);
    }

    const { data, error } = await query.order("fecha", { ascending: false });

    if (error) throw error;

    // Si no hay datos, retornar array vacío
    if (!data || data.length === 0) {
      console.log("No hay datos en el rango seleccionado");
      return [];
    }

    const groupedByDate = {};

    (data || []).forEach(item => {
      // Normalizar formato de fecha
      let fechaKey = item.fecha;
      if (fechaKey && fechaKey.includes("/")) {
        const [day, month, year] = fechaKey.split("/");
        fechaKey = `${year}-${month}-${day}`;
      }

      if (!groupedByDate[fechaKey]) {
        groupedByDate[fechaKey] = {
          fecha: fechaKey,
          total_ingresos: 0,      // Suma de montos
          total_egresos: 0,       // Suma de egresos (si aplica)
          cantidad_registros: 0,   // Conteo de registros
          activos: 0,
          salieron: 0
        };
      }

      // Sumar montos (importante: usa el campo correcto de tu tabla)
      const monto = parseFloat(item.monto) || parseFloat(item.pagado) || parseFloat(item.tarifa) || 0;
      
      // Identificar si es ingreso o egreso (ajusta según tu tabla)
      if (item.tipo === "ingreso" || item.tipo === "pago" || !item.tipo) {
        groupedByDate[fechaKey].total_ingresos += monto;
      } else if (item.tipo === "egreso" || item.tipo === "gasto") {
        groupedByDate[fechaKey].total_egresos += monto;
      }

      groupedByDate[fechaKey].cantidad_registros++;

      // Estado del vehículo
      if (item.hora_salida && item.hora_salida !== "") {
        groupedByDate[fechaKey].salieron++;
      } else {
        groupedByDate[fechaKey].activos++;
      }
    });

    // Convertir a array y calcular saldo
    const resultados = Object.values(groupedByDate).map(dia => ({
      ...dia,
      saldo: dia.total_ingresos - dia.total_egresos
    }));

    return resultados.slice(0, 30);

  } catch (error) {
    console.error("Error en getIngresosPorDia:", error);
    return [];
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