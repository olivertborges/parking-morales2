// src/utils/dateUtils.js
export function formatFecha(fecha) {
  if (!fecha) return "-";
  
  const fechaStr = String(fecha);
  
  // Si viene en formato YYYY-MM-DD (de Supabase)
  if (fechaStr.includes("-") && fechaStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
    const [year, month, day] = fechaStr.split("-");
    const diaFormateado = String(parseInt(day)).padStart(2, '0');
    const mesFormateado = String(parseInt(month)).padStart(2, '0');
    return `${diaFormateado}/${mesFormateado}/${year}`;
  }
  
  // Si ya viene en formato DD/MM/YYYY pero sin ceros
  if (fechaStr.includes("/")) {
    const [day, month, year] = fechaStr.split("/");
    const diaFormateado = String(parseInt(day)).padStart(2, '0');
    const mesFormateado = String(parseInt(month)).padStart(2, '0');
    return `${diaFormateado}/${mesFormateado}/${year}`;
  }
  
  // Intentar parsear como Date
  try {
    const date = new Date(fechaStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}
  
  return fechaStr;
}