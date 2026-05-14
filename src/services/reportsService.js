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
    // Primero, obtener los datos
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
      console.log("No hay datos, devolviendo estructura vacía");
      return [];
    }
    
    // Mostrar el primer registro para depuración
    console.log("Primer registro:", data[0]);
    console.log("Campos disponibles:", Object.keys(data[0]));
    
    // Identificar campos disponibles
    const primerItem = data[0];
    const campoFecha = primerItem.fecha ? "fecha" : 
                       primerItem.fecha_registro ? "fecha_registro" :
                       primerItem.dia ? "dia" : null;
    
    const campoMonto = primerItem.monto ? "monto" :
                       primerItem.pagado ? "pagado" :
                       primerItem.tarifa ? "tarifa" :
                       primerItem.precio ? "precio" :
                       primerItem.total ? "total" : null;
    
    const campoTipo = primerItem.tipo ? "tipo" :
                      primerItem.operacion ? "operacion" : null;
    
    console.log("Campos detectados - Fecha:", campoFecha, "Monto:", campoMonto, "Tipo:", campoTipo);
    
    const groupedByDate = {};
    
    data.forEach(item => {
      // Obtener fecha
      let fechaKey = campoFecha ? item[campoFecha] : item.fecha || item.fecha_registro;
      if (fechaKey && typeof fechaKey === "string" && fechaKey.includes("/")) {
        const [day, month, year] = fechaKey.split("/");
        fechaKey = `${year}-${month}-${day}`;
      } else if (fechaKey instanceof Date) {
        fechaKey = fechaKey.toISOString().split("T")[0];
      }
      
      if (!fechaKey) return;
      
      if (!groupedByDate[fechaKey]) {
        groupedByDate[fechaKey] = {
          fecha: fechaKey,
          ingresos: 0,
          egresos: 0,
          pendiente: 0
        };
      }
      
      // Obtener monto (si existe campo de monto)
      let monto = 0;
      if (campoMonto) {
        monto = parseFloat(item[campoMonto]) || 0;
      } else {
        // Si no hay campo de monto, contar como 1
        monto = 1;
      }
      
      // Determinar si es ingreso o egreso
      const tipo = campoTipo ? item[campoTipo]?.toLowerCase() : "";
      
      if (tipo === "egreso" || tipo === "gasto" || tipo === "salida") {
        groupedByDate[fechaKey].egresos += monto;
      } else {
        // Por defecto, es ingreso
        groupedByDate[fechaKey].ingresos += monto;
      }
      
      // Calcular pendientes (vehículos activos sin salida)
      if (item.hora_salida === null || item.hora_salida === undefined || item.hora_salida === "") {
        groupedByDate[fechaKey].pendiente++;
      }
    });
    
    const resultados = Object.values(groupedByDate);
    console.log("Resultados agrupados:", resultados);
    
    return resultados;
    
  } catch (error) {
    console.error("Error en getIngresosPorDia:", error);
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
    totalIngresos += dia.ingresos || 0;
    totalEgresos += dia.egresos || 0;
    totalPendientes += dia.pendiente || 0;
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