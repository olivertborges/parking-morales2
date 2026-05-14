// src/components/modals/RegisterVehicleModal.jsx
import { useState, useEffect, useRef } from "react";
import { X, Clock, Camera, AlertCircle, Sparkles, UserPlus, Search } from "lucide-react";
import { registerVehicle } from "../../services/vehicleService";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";
import Tesseract from "tesseract.js";

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
  const [buscandoDoctor, setBuscandoDoctor] = useState(false);
  const [mostrarOCR, setMostrarOCR] = useState(false);
  const [ocrProcesando, setOcrProcesando] = useState(false);
  const [doctorEncontrado, setDoctorEncontrado] = useState(null);
  const [mostrarAgregarDoctor, setMostrarAgregarDoctor] = useState(false);
  const [nuevoDoctor, setNuevoDoctor] = useState({ nombre: "", matricula: "", especialidad: "" });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const ultimaMatriculaBuscada = useRef("");

  // Función para normalizar matrícula
  const normalizarMatricula = (matricula) => {
    if (!matricula) return "";
    return matricula.replace(/\s/g, '').toUpperCase();
  };

  // Función para formatear matrícula en tiempo real
  const formatearMatriculaEnTiempoReal = (texto) => {
    let limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpio.length === 0) return "";
    
    if (limpio.length <= 3) {
      return limpio;
    } else if (limpio.length <= 7 && /^[A-Z]{3}\d+$/.test(limpio)) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3)}`;
    } else if (limpio.length <= 7 && /^[A-Z]\d+[A-Z]*$/.test(limpio)) {
      if (limpio.length <= 4) {
        return `${limpio.slice(0, 1)} ${limpio.slice(1)}`;
      } else {
        return `${limpio.slice(0, 1)} ${limpio.slice(1, 4)} ${limpio.slice(4)}`;
      }
    } else if (limpio.length <= 6 && /^[A-Z]{3}\d+$/.test(limpio)) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3)}`;
    } else if (limpio.length <= 7 && /^[A-Z]\d{3}\d*$/.test(limpio)) {
      if (limpio.length <= 4) {
        return `${limpio.slice(0, 1)} ${limpio.slice(1)}`;
      } else {
        return `${limpio.slice(0, 1)} ${limpio.slice(1, 4)} ${limpio.slice(4)}`;
      }
    }
    
    return limpio;
  };

  const handleMatriculaChange = (e) => {
    const formateado = formatearMatriculaEnTiempoReal(e.target.value);
    setFormData({ ...formData, matricula: formateado });
  };

  // Buscar médico por matrícula
  const buscarDoctorPorMatricula = async (matricula) => {
    if (!matricula || matricula.length < 4) return null;
    
    const matriculaNormalizada = normalizarMatricula(matricula);
    
    const { data, error } = await supabase.from("doctors").select("*");
    
    if (error) {
      console.error("Error en búsqueda:", error);
      return null;
    }
    
    const doctorEncontrado = data?.find(doctor => {
      const doctorMatricula = normalizarMatricula(doctor.matricula || "");
      return doctorMatricula === matriculaNormalizada;
    });
    
    return doctorEncontrado || null;
  };

  // Efecto para buscar cuando cambia la matrícula
  useEffect(() => {
    const buscar = async () => {
      const matriculaLimpia = normalizarMatricula(formData.matricula);
      
      if (matriculaLimpia.length < 4) {
        setDoctorEncontrado(null);
        return;
      }
      if (ultimaMatriculaBuscada.current === matriculaLimpia) return;
      ultimaMatriculaBuscada.current = matriculaLimpia;
      
      setBuscandoDoctor(true);
      const doctor = await buscarDoctorPorMatricula(formData.matricula);
      
      if (doctor) {
        setDoctorEncontrado(doctor);
        setFormData(prev => ({
          ...prev,
          nombre: doctor.nombre,
          tipo: doctor.tipo || "Medico"
        }));
        toast.success(`✅ Médico encontrado: ${doctor.nombre}`);
        setMostrarAgregarDoctor(false);
      } else {
        setDoctorEncontrado(null);
        setMostrarAgregarDoctor(true);
      }
      setBuscandoDoctor(false);
    };
    
    const timeout = setTimeout(buscar, 800);
    return () => clearTimeout(timeout);
  }, [formData.matricula]);

  // Agregar nuevo médico
  const agregarNuevoDoctor = async () => {
    if (!nuevoDoctor.nombre.trim()) {
      toast.error("Ingrese el nombre del médico");
      return;
    }
    
    const { error } = await supabase.from("doctors").insert([{
      nombre: nuevoDoctor.nombre,
      matricula: normalizarMatricula(formData.matricula),
      tipo: formData.tipo,
      especialidad: nuevoDoctor.especialidad || null
    }]);
    
    if (!error) {
      toast.success(`✅ Médico ${nuevoDoctor.nombre} agregado correctamente`);
      setMostrarAgregarDoctor(false);
      setNuevoDoctor({ nombre: "", matricula: "", especialidad: "" });
      setFormData(prev => ({ ...prev, nombre: nuevoDoctor.nombre }));
      setDoctorEncontrado({ nombre: nuevoDoctor.nombre, matricula: formData.matricula });
    } else {
      toast.error("Error al agregar médico");
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: defaultType,
      nombre: "",
      matricula: "",
      hora_entrada: new Date().toLocaleTimeString('es-AR', { hour12: false }),
      sin_tarjeta: false,
      motivo: "Olvidó",
      observaciones: ""
    });
    setDoctorEncontrado(null);
    setMostrarAgregarDoctor(false);
    setNuevoDoctor({ nombre: "", matricula: "", especialidad: "" });
    setError("");
    ultimaMatriculaBuscada.current = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [defaultType, open]);

  // Iniciar cámara OCR
  const abrirCamaraOCR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMostrarOCR(true);
    } catch (err) {
      console.error("Error al abrir cámara:", err);
      toast.error("Error al acceder a la cámara: " + err.message);
    }
  };

  const cerrarCamaraOCR = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setMostrarOCR(false);
  };

  const capturarYLeer = async () => {
    if (!videoRef.current) return;
    
    setOcrProcesando(true);
    
    try {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("La cámara no está lista");
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      
      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'spa',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`Progreso OCR: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      console.log("Texto detectado OCR:", text);
      
      let matriculaLimpia = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let matriculaFormateada = matriculaLimpia;
      
      if (matriculaLimpia.length === 6 && /^[A-Z]{3}\d{3}$/.test(matriculaLimpia)) {
        matriculaFormateada = `${matriculaLimpia.slice(0, 3)} ${matriculaLimpia.slice(3, 6)}`;
      } else if (matriculaLimpia.length === 7 && /^[A-Z]{3}\d{4}$/.test(matriculaLimpia)) {
        matriculaFormateada = `${matriculaLimpia.slice(0, 3)} ${matriculaLimpia.slice(3, 7)}`;
      } else if (matriculaLimpia.length === 7 && /^[A-Z]\d{3}\d{3}$/.test(matriculaLimpia)) {
        matriculaFormateada = `${matriculaLimpia.slice(0, 1)} ${matriculaLimpia.slice(1, 4)} ${matriculaLimpia.slice(4, 7)}`;
      } else if (matriculaLimpia.length >= 5 && matriculaLimpia.length <= 8) {
        if (matriculaLimpia.length <= 4) {
          matriculaFormateada = matriculaLimpia;
        } else if (matriculaLimpia.length <= 6) {
          matriculaFormateada = `${matriculaLimpia.slice(0, 3)} ${matriculaLimpia.slice(3)}`;
        } else {
          matriculaFormateada = `${matriculaLimpia.slice(0, 3)} ${matriculaLimpia.slice(3, 6)} ${matriculaLimpia.slice(6)}`;
        }
      }
      
      if (matriculaFormateada && matriculaFormateada.replace(/\s/g, '').length >= 5) {
        setFormData(prev => ({ ...prev, matricula: matriculaFormateada }));
        toast.success(`Matrícula detectada: ${matriculaFormateada}`);
        
        const doctor = await buscarDoctorPorMatricula(matriculaFormateada);
        if (doctor) {
          setFormData(prev => ({ ...prev, nombre: doctor.nombre, tipo: doctor.tipo || "Medico" }));
          toast.success(`✅ Médico encontrado: ${doctor.nombre}`);
        }
      } else {
        toast.error("No se pudo detectar la matrícula. Intente nuevamente con mejor luz.");
      }
      
      cerrarCamaraOCR();
    } catch (err) {
      console.error("Error en OCR:", err);
      toast.error("Error procesando la imagen: " + err.message);
    } finally {
      setOcrProcesando(false);
    }
  };

  const getColors = () => {
    const tipo = formData.tipo;
    if (tipo === "Medico") return { bg: "from-blue-500 to-blue-600", border: "border-blue-500/30", buttonBg: "from-blue-500 to-blue-600" };
    if (tipo === "Junta") return { bg: "from-purple-500 to-purple-600", border: "border-purple-500/30", buttonBg: "from-purple-500 to-purple-600" };
    if (tipo === "Reserva") return { bg: "from-green-500 to-green-600", border: "border-green-500/30", buttonBg: "from-green-500 to-green-600" };
    return { bg: "from-amber-500 to-orange-600", border: "border-amber-500/30", buttonBg: "from-amber-500 to-orange-600" };
  };

  const colors = getColors();

  if (!open) return null;

  const setCurrentTime = () => {
    setFormData({ ...formData, hora_entrada: new Date().toLocaleTimeString('es-AR', { hour12: false }) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      setLoading(false);
      toast.error("❌ El nombre es obligatorio");
      return;
    }

    if (!formData.matricula.trim()) {
      setError("La matrícula es obligatoria");
      setLoading(false);
      toast.error("❌ La matrícula es obligatoria");
      return;
    }

    const result = await registerVehicle(formData);
    
    if (result.success) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "REGISTRO_INGRESO", `${formData.nombre} - ${formData.matricula}`);
      
      toast.success(`✅ Vehículo ${formData.nombre} registrado correctamente`);
      handleClose();
      if (onSuccess) onSuccess();
    } else {
      toast.error(`❌ Error: ${result.error}`);
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

  return (
    <>
      {/* Modal OCR - CORREGIDO */}
      {mostrarOCR && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col" 
          style={{ backgroundColor: 'black' }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-black/80 z-10">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              Escanear matrícula
            </h3>
            <button 
              onClick={cerrarCamaraOCR} 
              className="text-white p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video - ocupa todo el espacio disponible */}
          <div className="flex-1 relative bg-black overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Guía para encuadrar */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 h-1/4 border-2 border-amber-400 rounded-lg">
                <p className="text-amber-400 text-xs text-center mt-2 bg-black/60 inline-block px-2 rounded mx-auto block w-fit">
                  Centra la matrícula aquí
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="p-4 flex gap-3 bg-black/80 z-10">
            <button 
              onClick={cerrarCamaraOCR} 
              className="flex-1 py-3 bg-red-600 rounded-xl text-white font-semibold hover:bg-red-700 transition"
            >
              Cancelar
            </button>
            <button 
              onClick={capturarYLeer} 
              disabled={ocrProcesando}
              className="flex-1 py-3 bg-amber-500 rounded-xl text-white font-semibold hover:bg-amber-600 transition disabled:opacity-50"
            >
              {ocrProcesando ? "Procesando..." : "Capturar"}
            </button>
          </div>

          {/* Overlay de procesamiento */}
          {ocrProcesando && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                <p className="text-white">Procesando imagen con OCR...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal principal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`rounded-t-2xl bg-gradient-to-r ${colors.bg} p-5 sticky top-0 z-10`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <span className="text-3xl">{getIcon()}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Registrar ingreso</h3>
                    <p className="text-white/70 text-xs">Complete los datos del vehículo</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Hora */}
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400 text-sm">Hora de entrada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={formData.hora_entrada} 
                      onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })} 
                      className="bg-slate-800 rounded-lg p-1.5 text-white text-sm border border-slate-600 focus:border-amber-500 outline-none" 
                    />
                    <button 
                      type="button" 
                      onClick={setCurrentTime} 
                      className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition"
                    >
                      Ahora
                    </button>
                  </div>
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tipo</label>
                <select 
                  value={formData.tipo} 
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} 
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Medico">👨‍⚕️ Médico</option>
                  <option value="Junta">🏛️ Junta Directiva</option>
                  <option value="Reserva">⭐ Reserva</option>
                </select>
              </div>

              {/* Matrícula */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Matrícula</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={handleMatriculaChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl p-3 text-white uppercase font-mono tracking-wide focus:border-amber-500 focus:outline-none"
                    placeholder="ABC 1234 / A 123 BCD"
                    autoComplete="off"
                  />
                  <button 
                    type="button" 
                    onClick={abrirCamaraOCR} 
                    className="px-4 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition"
                    title="Escanear matrícula"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                
                {buscandoDoctor && (
                  <div className="mt-2 flex items-center gap-2 text-amber-400 text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-500"></div>
                    Buscando médico...
                  </div>
                )}
                
                {doctorEncontrado && (
                  <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs flex items-center justify-between">
                    <span>✅ Médico encontrado: {doctorEncontrado.nombre}</span>
                  </div>
                )}
                
                {mostrarAgregarDoctor && formData.matricula.length >= 5 && !buscandoDoctor && !doctorEncontrado && (
                  <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-xs mb-2">⚠️ Médico no encontrado para la matrícula {formData.matricula}</p>
                    <button
                      type="button"
                      onClick={() => setMostrarAgregarDoctor(false)}
                      className="w-full py-1.5 bg-yellow-600/50 hover:bg-yellow-600 rounded-lg text-yellow-300 text-xs flex items-center justify-center gap-1 transition"
                    >
                      <UserPlus className="w-3 h-3" /> Agregar nuevo médico
                    </button>
                  </div>
                )}
                
                {!mostrarAgregarDoctor && formData.matricula.length >= 5 && !buscandoDoctor && !doctorEncontrado && (
                  <div className="mt-2 p-2 bg-slate-700/50 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del nuevo médico"
                        value={nuevoDoctor.nombre}
                        onChange={(e) => setNuevoDoctor({ ...nuevoDoctor, nombre: e.target.value })}
                        className="flex-1 bg-slate-800 rounded-lg p-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={agregarNuevoDoctor}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-white text-xs transition"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Nombre del médico"
                />
              </div>

              {/* Sin tarjeta */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                <label className="text-white text-sm">Sin tarjeta</label>
                <input 
                  type="checkbox" 
                  checked={formData.sin_tarjeta} 
                  onChange={(e) => setFormData({ ...formData, sin_tarjeta: e.target.checked })} 
                  className="w-5 h-5 rounded accent-amber-500"
                />
              </div>

              {formData.sin_tarjeta && (
                <div className="space-y-2 p-3 bg-red-500/10 rounded-xl">
                  <select 
                    value={formData.motivo} 
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} 
                    className="w-full bg-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none"
                  >
                    <option>Olvidó</option>
                    <option>Perdió</option>
                    <option>No funciona</option>
                  </select>
                  <textarea 
                    placeholder="Observaciones" 
                    rows="2" 
                    value={formData.observaciones} 
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} 
                    className="w-full bg-slate-700 rounded-lg p-2 text-white text-sm resize-none focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 rounded-xl p-2 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  className="flex-1 py-3 rounded-xl border border-slate-600 text-white hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={`flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${colors.buttonBg} hover:opacity-90 transition disabled:opacity-50`}
                >
                  {loading ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}