// src/components/QRModal.jsx
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { X, Download } from "lucide-react";

export default function QRModal({ medico, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (medico && canvasRef.current) {
      const qrData = JSON.stringify({
        nombre: medico.nombre,
        matricula: medico.matricula,
        tipo: "medico"
      });
      QRCode.toCanvas(canvasRef.current, qrData, { width: 200 });
    }
  }, [medico]);

  const downloadQR = () => {
    const link = document.createElement("a");
    link.download = `qr_${medico.matricula}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-sm w-full text-center p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Código QR</h3>
          <button onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <canvas ref={canvasRef} className="mx-auto bg-white p-4 rounded-2xl"></canvas>
        
        <p className="text-white font-semibold mt-4">{medico.nombre}</p>
        <p className="text-slate-400 text-sm">{medico.matricula}</p>
        
        <button
          onClick={downloadQR}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-amber-500 rounded-xl text-white"
        >
          <Download className="w-4 h-4" />
          Descargar QR
        </button>
      </div>
    </div>
  );
}