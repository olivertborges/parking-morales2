// src/components/modals/RegisterVehicleModal.jsx
import { useState, useEffect, useRef } from "react";
import { X, Clock, Camera, UserPlus } from "lucide-react";
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
  const [nuevoDoctor, setNuevoDoctor] = useState({ nombre: "", especialidad: "" });
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const ultimaMatriculaBuscada = useRef("");

  const normalizarMatricula = (matricula) => {
    if (!matricula) return "";
    return matricula.replace(/\s/g, '').toUpperCase();
  };

  const formatearMatriculaEnTiempoReal = (texto) => {
    let limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpio.length === 0) return "";
    
    if (limpio.length <= 3) return limpio;
    if (limpio.length === 6 && /^[A-Z]{3}\d{3}$/.test(limpio)) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)}`;
    }
    if (limpio.length === 7 && /^[A-Z]{3}\d{4}$/.test(limpio)) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3, 7)}`;
    }
    if (limpio.length === 7 && /^[A-Z]\d{3}\d{3}$/.test(limpio)) {
      return `${limpio.slice(0, 1)} ${limpio.slice(1, 4)} ${limpio.slice(4, 7)}`;
    }
    if (limpio.length >= 5 && limpio.length <= 8) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3)}`;
    }
    return limpio;
  };

  const handleMatriculaChange = (e) => {
    const formateado = formatearMatriculaEnTiempoReal(e.target.value);
    setFormData({ ...formData, matricula: formateado });
  };

  const buscarDoctorPorMatricula = async (matricula) => {
    if (!matricula || matricula.length < 4) return null;
    const matriculaNormalizada = normalizarMatricula(matricula);
    const { data, error } = await supabase.from("doctors").select("*");
    if (error) return null;
    return data?.find(doctor => normalizarMatricula(doctor.matricula || "") === matriculaNormalizada) || null;
  };

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
        setFormData(prev => ({ ...prev, nombre: doctor.nombre }));
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
      toast.success(`✅ Médico ${nuevoDoctor.nombre} agregado`);
      setMostrarAgregarDoctor(false);
      setNuevoDoctor({ nombre: "", especialidad: "" });
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
    setNuevoDoctor({ nombre: "", especialidad: "" });
    setError("");
    ultimaMatriculaBuscada.current = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (open) resetForm();
  }, [defaultType, open]);

  // ========== OCR ==========
  const abrirCamaraOCR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setMostrarOCR(true);
    } catch (err) {
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
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    try {
      const { data: { text } } = await Tesseract.recognize(
        canvas.toDataURL("image/jpeg"),
        'spa',
        { logger: (m) => console.log(m) }
      );
      
      const matriculaDetectada = formatearMatriculaEnTiempoReal(text);
      
      if (matriculaDetectada && matriculaDetectada.length >= 5) {
        setFormData(prev => ({ ...prev, matricula: matriculaDetectada }));
        toast.success(`Matrícula detectada: ${matriculaDetectada}`);
        
        const doctor = await buscarDoctorPorMatricula(matriculaDetectada);
        if (doctor) {
          setFormData(prev => ({ ...prev, nombre: doctor.nombre }));
          toast.success(`✅ Médico encontrado: ${doctor.nombre}`);
        }
      } else {
        toast.error("No se pudo detectar la matrícula");
      }
      
      cerrarCamaraOCR();
    } catch (err) {
      toast.error("Error procesando imagen");
    } finally {
      setOcrProcesando(false);
    }
  };

  const getColors = () => {
    const tipo = formData.tipo;
    if (tipo === "Medico") return { bg: "from-blue-500 to-blue-600", buttonBg: "from-blue-500 to-blue-600" };
    if (tipo === "Junta") return { bg: "from-purple-500 to-purple-600", buttonBg: "from-purple-500 to-purple-600" };
    if (tipo === "Reserva") return { bg: "from-green-500 to-green-600", buttonBg: "from-green-500 to-green-600" };
    return { bg: "from-amber-500 to-orange-600", buttonBg: "from-amber-500 to-orange-600" };
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
      
      toast.success(`✅ Vehículo registrado correctamente`);
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
      {/* MODAL OCR - VERSIÓN SIMPLE QUE SÍ FUNCIONA */}
      {mostrarOCR && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black border-b border-gray-800">
            <h3 className="text-white font-bold text-lg">Escanear matrícula</h3>
            <button onClick={cerrarCamaraOCR} className="text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 relative bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-20 border-2 border-amber-400 rounded-lg">
                <p className="text-amber-400 text-xs text-center mt-2">Centra la matrícula</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex gap-3 bg-black">
            <button onClick={cerrarCamaraOCR} className="flex-1 py-3 bg-red-600 rounded-xl text-white font-semibold">
              Cancelar
            </button>
            <button onClick={capturarYLeer} disabled={ocrProcesando} className="flex-1 py-3 bg-amber-500 rounded-xl text-white font-semibold disabled:opacity-50">
              {ocrProcesando ? "Procesando..." : "Capturar"}
            </button>
          </div>
          
          {ocrProcesando && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                <p className="text-white">Procesando imagen...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PRINCIPAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                    <button type="button" onClick={setCurrentTime} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg">
                      Ahora
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tipo</label>
                <select 
                  value={formData.tipo} 
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} 
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white"
                >
                  <option value="Medico">👨‍⚕️ Médico</option>
                  <option value="Junta">🏛️ Junta Directiva</option>
                  <option value="Reserva">⭐ Reserva</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Matrícula</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={handleMatriculaChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl p-3 text-white uppercase font-mono"
                    placeholder="ABC 1234"
                    autoComplete="off"
                  />
                  <button type="button" onClick={abrirCamaraOCR} className="px-4 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
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
                  <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs">
                    ✅ Médico encontrado: {doctorEncontrado.nombre}
                  </div>
                )}
                
                {mostrarAgregarDoctor && formData.matricula.length >= 5 && !buscandoDoctor && !doctorEncontrado && (
                  <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-400 text-xs mb-2">⚠️ Médico no encontrado</p>
                    <button type="button" onClick={() => setMostrarAgregarDoctor(false)} className="w-full py-1.5 bg-yellow-600/50 rounded-lg text-yellow-300 text-xs flex items-center justify-center gap-1">
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
                        className="flex-1 bg-slate-800 rounded-lg p-1.5 text-white text-xs"
                      />
                      <button type="button" onClick={agregarNuevoDoctor} className="px-3 py-1.5 bg-green-600 rounded-lg text-white text-xs">
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white"
                  placeholder="Nombre del médico"
                />
              </div>

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
                    className="w-full bg-slate-700 rounded-lg p-2 text-white text-sm"
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
                    className="w-full bg-slate-700 rounded-lg p-2 text-white text-sm resize-none"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 rounded-xl p-2 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-white">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${colors.buttonBg} disabled:opacity-50`}>
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