// src/components/modals/RegisterVehicleModal.jsx
import { useState, useRef, useEffect } from "react";
import { X, Camera, Clock, AlertCircle, User, Car, Calendar, Sparkles } from "lucide-react";
import { registerVehicle } from "../../services/vehicleService";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";
import CameraOCR from "../ocr/CameraOCR";

export default function RegisterVehicleModal({ open, onClose, onSuccess, defaultType = "Medico" }) {
  const [formData, setFormData] = useState({
    tipo: defaultType,
    nombre: "",
    matricula: "",
    hora_entrada: new Date().toLocaleTimeString('es-AR', { hour12: false }),
    sin_tarjeta: false,
    motivo: "Olvidó",
    observaciones: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [showCameraOCR, setShowCameraOCR] = useState(false);
  const [matriculaFormat, setMatriculaFormat] = useState("formato1");
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        tipo: defaultType
      }));
    }
  }, [defaultType, open]);

  const getColors = () => {
    const tipo = formData.tipo;
    if (tipo === "Medico") {
      return {
        bg: "from-blue-500 to-blue-600",
        border: "border-blue-500/30",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-400",
        buttonBg: "from-blue-500 to-blue-600",
        glow: "shadow-blue-500/30"
      };
    }
    if (tipo === "Junta") {
      return {
        bg: "from-purple-500 to-purple-600",
        border: "border-purple-500/30",
        iconBg: "bg-purple-500/20",
        iconColor: "text-purple-400",
        buttonBg: "from-purple-500 to-purple-600",
        glow: "shadow-purple-500/30"
      };
    }
    if (tipo === "Reserva") {
      return {
        bg: "from-green-500 to-green-600",
        border: "border-green-500/30",
        iconBg: "bg-green-500/20",
        iconColor: "text-green-400",
        buttonBg: "from-green-500 to-green-600",
        glow: "shadow-green-500/30"
      };
    }
    return {
      bg: "from-amber-500 to-orange-600",
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      buttonBg: "from-amber-500 to-orange-600",
      glow: "shadow-amber-500/30"
    };
  };

  const colors = getColors();
 

  if (!open) return null;

  const formatMatricula = (value) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (matriculaFormat === "formato1" && cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + " " + cleaned.slice(3, 7);
    } else if (matriculaFormat === "formato2" && cleaned.length > 1) {
      cleaned = cleaned.slice(0, 1) + " " + cleaned.slice(1, 4);
      if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + " " + cleaned.slice(5, 8);
    } else if (matriculaFormat === "formato3" && cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + " " + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  const handleMatriculaChange = (e) => {
    const formatted = formatMatricula(e.target.value);
    setFormData({ ...formData, matricula: formatted });
  };

const setCurrentTime = () => {
  setFormData({ ...formData, hora_entrada: new Date().toLocaleTimeString('es-AR', { hour12: false }) });
};

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (err) {
      toast.error("Error al acceder a la cámara");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      alert("Captura tomada. Ingresa la matrícula manualmente.");
      stopCamera();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      setLoading(false);
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!formData.matricula.trim()) {
      setError("La matrícula es obligatoria");
      setLoading(false);
      toast.error("La matrícula es obligatoria");
      return;
    }

    const result = await registerVehicle(formData);
    
    if (result.success) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "REGISTRO_INGRESO", `${formData.nombre} - ${formData.matricula}`);
      toast.success(`${formData.nombre} registrado correctamente`);
      onClose();
      if (onSuccess) onSuccess();
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(`Error: ${result.error}`);
      setError(result.error);
    }
    setLoading(false);
  };

  const getIcon = () => {
    switch (formData.tipo) {
      case "Medico": return "👨‍⚕️";
      case "Junta": return "🏛️";
      case "Reserva": return "⭐";
      default: return "🚗";
    }
  };

  const getTitle = () => {
    switch (formData.tipo) {
      case "Medico": return "Nuevo Ingreso - Médico";
      case "Junta": return "Nuevo Ingreso - Junta Directiva";
      case "Reserva": return "Nuevo Ingreso - Reserva";
      default: return "Registrar Ingreso";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-slate-800 rounded-2xl max-w-lg w-full border ${colors.border} shadow-2xl`}>
        {/* Header */}
        <div className={`rounded-t-2xl bg-gradient-to-r ${colors.bg} p-5`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-3xl">{getIcon()}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{getTitle()}</h3>
                <p className="text-white/70 text-xs">Complete los datos del ingreso</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-slate-400 text-xs">Tipo</p>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 text-sm font-semibold ${colors.iconColor}`}>
                <span>{getIcon()}</span>
                <span>{formData.tipo}</span>
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3">
              <p className="text-slate-400 text-xs">Hora entrada</p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="time"
                  value={formData.hora_entrada}
                  onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                  className="flex-1 bg-slate-800 rounded-lg p-1.5 text-white text-sm border border-slate-600 focus:border-amber-500 outline-none"
                />
                <button type="button" onClick={setCurrentTime} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg">
                  Ahora
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">Nombre completo</p>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-slate-800 rounded-lg p-2 text-white text-sm border border-slate-600 focus:border-amber-500 outline-none mt-1"
              placeholder="Nombre completo"
            />
          </div>

          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-2">Matrícula</p>
            <div className="flex gap-1 mb-2">
              {["ABC 1234", "A 123 BCD", "ABC 123"].map((format, idx) => (
                <button key={idx} type="button" onClick={() => setMatriculaFormat(`formato${idx + 1}`)} className={`flex-1 text-[10px] py-1 rounded-lg transition ${matriculaFormat === `formato${idx + 1}` ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                  {format}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.matricula}
                onChange={handleMatriculaChange}
                className="flex-1 bg-slate-800 rounded-lg p-2 text-white uppercase text-sm border border-slate-600 focus:border-amber-500 outline-none"
                placeholder="Ingrese matrícula"
              />
              <button type="button" onClick={() => setShowCameraOCR(true)} className="px-3 rounded-lg bg-amber-500/20 text-amber-400">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
            <label className="text-white text-sm">Sin tarjeta</label>
            <input type="checkbox" checked={formData.sin_tarjeta} onChange={(e) => setFormData({ ...formData, sin_tarjeta: e.target.checked })} className="w-5 h-5 rounded" />
          </div>

          {formData.sin_tarjeta && (
            <div className="space-y-2 p-3 bg-red-500/10 rounded-xl">
              <select value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} className="w-full bg-slate-800 rounded-lg p-2 text-white text-sm">
                <option>Olvidó</option>
                <option>Perdió</option>
                <option>No funciona</option>
              </select>
              <textarea placeholder="Observaciones" rows="1" value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} className="w-full bg-slate-800 rounded-lg p-2 text-white text-sm resize-none" />
            </div>
          )}

          {error && <div className="bg-red-500/10 rounded-xl p-2 text-red-400 text-xs text-center">{error}</div>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-600 text-white">Cancelar</button>
            <button type="submit" disabled={loading} className={`flex-1 py-2 rounded-xl font-semibold text-white bg-gradient-to-r ${colors.buttonBg}`}>
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>

      {showCameraOCR && <CameraOCR onDetect={(matricula) => { setFormData({ ...formData, matricula }); setShowCameraOCR(false); }} onClose={() => setShowCameraOCR(false)} />}
    </div>
  );
}