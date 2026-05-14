// src/components/CameraOCRSimple.jsx
import { useState, useRef, useEffect } from "react";
import { X, Camera } from "lucide-react";
import Tesseract from "tesseract.js";

export default function CameraOCRSimple({ onDetect, onClose }) {
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    iniciarCamara();
    return () => {
      detenerCamara();
    };
  }, []);

  const iniciarCamara = async () => {
    try {
      setError("");
      console.log("Solicitando acceso a la cámara...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      console.log("Cámara obtenida:", stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video cargado, dimensiones:", videoRef.current.videoWidth, videoRef.current.videoHeight);
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Error al iniciar cámara:", err);
      setError(`No se pudo acceder a la cámara: ${err.message}`);
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Track detenido:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturarImagen = async () => {
    if (!videoRef.current || !cameraReady) {
      setError("La cámara no está lista");
      return;
    }

    setProcessing(true);
    
    try {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Opcional: Mostrar preview para debug
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      
      console.log("Imagen capturada, dimensiones:", canvas.width, canvas.height);
      
      const { data: { text } } = await Tesseract.recognize(
        imageDataUrl,
        'spa',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      console.log("Texto OCR:", text);
      
      // Limpiar texto para obtener matrícula
      const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let matricula = cleaned;
      
      // Formatear según longitud
      if (cleaned.length === 6) {
        matricula = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`;
      } else if (cleaned.length === 7) {
        if (/^[A-Z]{3}\d{4}$/.test(cleaned)) {
          matricula = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)}`;
        } else if (/^[A-Z]\d{3}\d{3}$/.test(cleaned)) {
          matricula = `${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}`;
        }
      } else if (cleaned.length === 8) {
        matricula = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}`;
      }
      
      if (matricula && matricula.replace(/\s/g, '').length >= 5) {
        onDetect(matricula);
      } else {
        setError(`No se pudo detectar la matrícula. Texto detectado: "${text.substring(0, 50)}"`);
        setTimeout(() => setError(""), 3000);
      }
      
      detenerCamara();
      onClose();
    } catch (err) {
      console.error("Error en OCR:", err);
      setError(`Error procesando: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/80">
        <h3 className="text-white font-bold text-lg">Escanear matrícula</h3>
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Guía */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-4/5 h-1/4 border-2 border-amber-400 rounded-lg">
            <p className="text-amber-400 text-xs text-center mt-2 bg-black/60 px-2 py-1 rounded inline-block mx-auto block w-fit">
              Centra la matrícula
            </p>
          </div>
        </div>

        {/* Loading */}
        {!cameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
              <p className="text-white text-sm">Iniciando cámara...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute bottom-20 left-4 right-4 bg-red-900/90 p-3 rounded-lg">
            <p className="text-white text-center text-sm">{error}</p>
          </div>
        )}

        {/* Procesando */}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
              <p className="text-white text-sm">Procesando imagen...</p>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="p-4 flex gap-3 bg-black/80">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-red-600 rounded-xl text-white font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={capturarImagen}
          disabled={!cameraReady || processing}
          className="flex-1 py-3 bg-amber-500 rounded-xl text-white font-semibold disabled:opacity-50"
        >
          {processing ? "Procesando..." : "Capturar"}
        </button>
      </div>
    </div>
  );
}