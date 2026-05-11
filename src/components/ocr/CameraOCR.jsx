// src/components/CameraOCR.jsx
import { useState, useRef } from "react";
import { Camera, X, Scan, AlertCircle } from "lucide-react";
import Tesseract from "tesseract.js";

export default function CameraOCR({ onDetect, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Usar cámara trasera en móvil
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      setError(null);
    } catch (err) {
      setError("Error accediendo a la cámara: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setResult(null);
  };

  const captureAndOCR = async () => {
    if (!videoRef.current) return;
    
    setProcessing(true);
    
    // Crear canvas para capturar imagen
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Procesar con Tesseract
    const imageData = canvas.toDataURL("image/jpeg");
    
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'spa', // Idioma español
        {
          logger: (m) => console.log(m)
        }
      );
      
      // Limpiar y extraer matrícula (formato: ABC 1234, A 123 BCD, etc)
      const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let matricula = "";
      
      // Intentar detectar formato
      if (cleaned.length >= 6 && cleaned.length <= 8) {
        if (cleaned.length === 7) {
          matricula = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)}`;
        } else if (cleaned.length === 6) {
          matricula = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
        } else if (cleaned.length === 8) {
          matricula = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}`;
        }
      }
      
      setResult({ text: matricula || cleaned, raw: text });
      stopCamera();
    } catch (err) {
      setError("Error procesando la imagen: " + err.message);
    }
    
    setProcessing(false);
  };

  const confirmMatricula = () => {
    if (result && onDetect) {
      onDetect(result.text);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Scan className="w-5 h-5 text-amber-400" />
          Escanear matrícula
        </h3>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!scanning ? (
          <div className="text-center space-y-4">
            <div className="w-32 h-32 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
              <Camera className="w-12 h-12 text-amber-400" />
            </div>
            <p className="text-white">Enfoca la matrícula del vehículo</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white font-semibold"
            >
              Abrir cámara
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full rounded-2xl border-2 border-amber-500"
            />
            <div className="absolute inset-0 border-2 border-amber-400 rounded-2xl pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-1/3 border-2 border-amber-400 rounded-lg"></div>
            </div>
          </div>
        )}

        {processing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-white">Procesando imagen...</p>
            </div>
          </div>
        )}

        {result && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-800 p-6 rounded-t-2xl">
            <p className="text-white text-center mb-2">Matrícula detectada:</p>
            <p className="text-3xl font-bold text-amber-400 text-center mb-4">{result.text}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 border border-slate-600 rounded-xl text-white">
                Cancelar
              </button>
              <button onClick={confirmMatricula} className="flex-1 bg-amber-500 py-2 rounded-xl text-white font-semibold">
                Usar esta matrícula
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-900 p-4">
            <p className="text-white text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Botones de control de cámara */}
      {scanning && !result && (
        <div className="p-4 flex gap-3">
          <button onClick={stopCamera} className="flex-1 py-3 bg-red-600 rounded-xl text-white font-semibold">
            Cancelar
          </button>
          <button onClick={captureAndOCR} className="flex-1 py-3 bg-amber-500 rounded-xl text-white font-semibold">
            Capturar
          </button>
        </div>
      )}
    </div>
  );
}