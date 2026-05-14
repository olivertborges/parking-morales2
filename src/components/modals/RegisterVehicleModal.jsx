// src/components/modals/RegisterVehicleModal.jsx
import { useState, useEffect, useRef } from "react";
import { X, Clock, UserPlus, KeyRound, AlertCircle } from "lucide-react";
import { registerVehicle } from "../../services/vehicleService";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

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
  const [doctorEncontrado, setDoctorEncontrado] = useState(null);
  const [mostrarAgregarDoctor, setMostrarAgregarDoctor] = useState(false);
  const [nuevoDoctor, setNuevoDoctor] = useState({ 
    nombre: "", 
    modelo: "", 
    color: "" 
  });
  
  const ultimaMatriculaBuscada = useRef("");

  const normalizarMatricula = (matricula) => {
    if (!matricula) return "";
    return matricula.replace(/\s/g, '').toUpperCase();
  };

  const formatearMatriculaEnTiempoReal = (texto) => {
    let limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (limpio.length === 0) return "";
    
    if (limpio.length === 6 && /^[A-Z]{3}\d{3}$/.test(limpio)) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)}`;
    }
    if (limpio.length === 7 && /^[A-Z]{3}\d{4}$/.test(limpio)) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3, 7)}`;
    }
    if (limpio.length === 7 && /^[A-Z]\d{3}[A-Z]{3}$/.test(limpio)) {
      return `${limpio.slice(0, 1)} ${limpio.slice(1, 4)} ${limpio.slice(4, 7)}`;
    }
    if (limpio.length === 7 && /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(limpio)) {
      return `${limpio.slice(0, 2)} ${limpio.slice(2, 5)} ${limpio.slice(5, 7)}`;
    }
    if (limpio.length > 3 && limpio.length <= 6) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3)}`;
    }
    if (limpio.length > 6) {
      return `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`;
    }
    
    return limpio;
  };

  const handleMatriculaChange = (e) => {
    const formateado = formatearMatriculaEnTiempoReal(e.target.value);
    setFormData({ ...formData, matricula: formateado });
    setDoctorEncontrado(null);
    setMostrarAgregarDoctor(false);
  };

  const buscarDoctorPorMatricula = async (matricula) => {
    if (!matricula || matricula.length < 4) return null;
    const matriculaNormalizada = normalizarMatricula(matricula);
    
    const { data, error } = await supabase.from("doctors").select("*");
    
    if (error) {
      console.error("Error al buscar médicos:", error);
      return null;
    }
    
    const doctor = data?.find(doctor => {
      const doctorMatricula = normalizarMatricula(doctor.matricula || "");
      return doctorMatricula === matriculaNormalizada;
    });
    
    return doctor || null;
  };

  useEffect(() => {
    const buscar = async () => {
      const matriculaLimpia = normalizarMatricula(formData.matricula);
      if (matriculaLimpia.length < 4) {
        setDoctorEncontrado(null);
        setMostrarAgregarDoctor(false);
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
    
    const matriculaNormalizada = normalizarMatricula(formData.matricula);
    
    const { error } = await supabase.from("doctors").insert({
      nombre: nuevoDoctor.nombre,
      matricula: matriculaNormalizada,
      modelo: nuevoDoctor.modelo || "",
      color: nuevoDoctor.color || ""
    });
    
    if (!error) {
      toast.success(`✅ Médico ${nuevoDoctor.nombre} agregado correctamente`);
      setMostrarAgregarDoctor(false);
      setDoctorEncontrado({ 
        nombre: nuevoDoctor.nombre, 
        matricula: matriculaNormalizada 
      });
      setFormData(prev => ({ ...prev, nombre: nuevoDoctor.nombre }));
      setNuevoDoctor({ nombre: "", modelo: "", color: "" });
    } else {
      console.error("Error al agregar médico:", error);
      toast.error(`Error: ${error.message}`);
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
    setNuevoDoctor({ nombre: "", modelo: "", color: "" });
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
              {/* Hora de entrada */}
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
                    <button type="button" onClick={setCurrentTime} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition">
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
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Matrícula
                </label>
                <input
                  type="text"
                  required
                  value={formData.matricula}
                  onChange={handleMatriculaChange}
                  className="w-full bg-slate-700 border-2 border-slate-600 rounded-xl p-4 text-white uppercase font-mono text-2xl tracking-wider text-center focus:border-amber-500 focus:outline-none transition"
                  placeholder="ABC 1234"
                  autoComplete="off"
                  maxLength={9}
                />
                <div className="flex flex-wrap justify-between mt-2 gap-2">
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Ej: ABC 1234</span>
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Ej: A 123 BCD</span>
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Ej: AB 123 CD</span>
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  {formData.matricula.replace(/\s/g, '').length}/7 caracteres
                </p>
              </div>

              {/* Buscando médico */}
              {buscandoDoctor && (
                <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 p-2 rounded-lg">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-500"></div>
                  Buscando médico...
                </div>
              )}
              
              {/* Médico encontrado */}
              {doctorEncontrado && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm font-medium">✅ Médico encontrado</p>
                  <p className="text-white text-sm mt-1">{doctorEncontrado.nombre}</p>
                </div>
              )}
              
              {/* Botón para agregar médico cuando no se encuentra */}
              {mostrarAgregarDoctor && formData.matricula.length >= 5 && !buscandoDoctor && !doctorEncontrado && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs mb-2">⚠️ Médico no encontrado para la matrícula {formData.matricula}</p>
                  <button 
                    type="button" 
                    onClick={() => setMostrarAgregarDoctor(false)} 
                    className="w-full py-2 bg-yellow-600/50 hover:bg-yellow-600 rounded-lg text-yellow-300 text-sm flex items-center justify-center gap-2 transition"
                  >
                    <UserPlus className="w-4 h-4" /> Agregar nuevo médico
                  </button>
                </div>
              )}
              
              {/* Formulario para agregar nuevo médico */}
              {!mostrarAgregarDoctor && formData.matricula.length >= 5 && !buscandoDoctor && !doctorEncontrado && (
                <div className="p-3 bg-slate-700/50 rounded-lg space-y-2">
                  <p className="text-slate-300 text-xs">Nuevo médico:</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={nuevoDoctor.nombre}
                      onChange={(e) => setNuevoDoctor({ ...nuevoDoctor, nombre: e.target.value })}
                      className="w-full bg-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-amber-500 border border-transparent focus:border-amber-500"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Modelo del vehículo (opcional)"
                      value={nuevoDoctor.modelo}
                      onChange={(e) => setNuevoDoctor({ ...nuevoDoctor, modelo: e.target.value })}
                      className="w-full bg-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-amber-500 border border-transparent focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Color del vehículo (opcional)"
                      value={nuevoDoctor.color}
                      onChange={(e) => setNuevoDoctor({ ...nuevoDoctor, color: e.target.value })}
                      className="w-full bg-slate-800 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-amber-500 border border-transparent focus:border-amber-500"
                    />
                    <button 
                      type="button" 
                      onClick={agregarNuevoDoctor} 
                      className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition"
                    >
                      Guardar médico
                    </button>
                  </div>
                </div>
              )}

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

              {/* Motivo y observaciones */}
              {formData.sin_tarjeta && (
                <div className="space-y-2 p-3 bg-red-500/10 rounded-xl">
                  <select 
                    value={formData.motivo} 
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} 
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm focus:outline-none"
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
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm resize-none focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 rounded-xl p-2 text-red-400 text-xs text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-white hover:bg-slate-700 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${colors.buttonBg} hover:opacity-90 transition disabled:opacity-50`}>
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