// src/utils/pdfUtils.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "/seguridad.png";

export async function exportToPDF(data, tipo, subtitulo, columnas) {
  return new Promise((resolve) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm" });

    // ============ LÍNEA SUPERIOR ============
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 15, 190, 15);
    
    // ============ IZQUIERDA: LOGO ============
const logoImg = "/seguridad.png";
doc.addImage(logoImg, 'PNG', 20, 20, 25, 25);
    
    // ============ CENTRO: ENCABEZADOS ============
    const centerX = 105;
    
    // SEGURIDAD DIFERENTE
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11);
    doc.setFont("helvetica", "bold");
    doc.text("SEGURIDAD DIFERENTE", centerX, 22, { align: "center" });
    
    // R. Guarino & Asociados
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("R. Guarino & Asociados", centerX, 28, { align: "center" });
    
    // HOSPITAL BRITANICO
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("HOSPITAL BRITANICO", centerX, 36, { align: "center" });
    
    // Control de Estacionamiento o Historial de Movimientos
    doc.setFontSize(9);
    doc.setTextColor(245, 158, 11);
    const tituloSecundario = tipo === "movimientos" ? "Control de Estacionamiento" : "Control de Estacionamiento - Historial de Lugares";
    doc.setFont("helvetica", "bold");
    doc.text(tituloSecundario, centerX, 43, { align: "center" });
    
    // ============ DERECHA: FECHA, HORA, TOTAL ============
    const rightX = 190;
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, rightX, 22, { align: "right" });
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-AR', { hour12: false })}`, 20, 28);
    doc.text(`Total registros: ${data.length}`, rightX, 34, { align: "right" });
    
    if (subtitulo) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(subtitulo, rightX, 40, { align: "right" });
    }
    
    // ============ LÍNEA INFERIOR DEL ENCABEZADO ============
    doc.line(20, 50, 190, 50);
    
    // ============ TABLA ============
    const startY = 58;
    
    autoTable(doc, {
      startY: startY,
      head: [columnas],
      body: data,
      theme: "striped",
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        fontSize: 9
      },
      bodyStyles: {
        textColor: [50, 50, 50],
        fillColor: [255, 255, 255],
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      styles: {
        cellPadding: 3,
        halign: "center",
        valign: "middle"
      }
    });

    // ============ PIE DE PÁGINA ============
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Sistema de Control de Estacionamiento", 105, finalY, { align: "center" });
    
    // Guardar
    const filename = `${tituloSecundario.toLowerCase().replace(/ /g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    resolve(true);
  });
}