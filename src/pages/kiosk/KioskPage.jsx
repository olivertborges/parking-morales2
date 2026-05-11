// src/pages/kiosk/KioskPage.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import { Car, CheckCircle, AlertCircle, Camera } from "lucide-react";
import toast from "react-hot-toast";
import CameraOCR from "../../components/ocr/CameraOCR";

export default function KioskPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    tipo: "Medico",
    nombre: "",
    matricula: "",
    sin_tarjeta: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [places, setPlaces] = useState({ libres: 0, ocupados: 0 });

  useEffect(() => {
    loadPlaces();
    const interval = setInterval(loadPlaces, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadPlaces() {
    const { data } = await supabase.from("active_vehicles").select("*");
    const ocupados = data?.length || 0;
    setPlaces({ libres: 37 - ocupados, ocupados });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("active_vehicles").insert([{
      nombre: formData.nombre,
      tipo: formData.tipo,
      matricula: formData.matricula.toUpperCase(),
      hora_entrada: new Date().toLocaleTimeString('es-AR'),
      sin_tarjeta: formData.sin_tarjeta,
      created_at: new Date().toISOString()
    }]);

    if (!error) {
      await supabase.from("history").insert([{
        nombre: formData.nombre,
        tipo: formData.tipo,
        matricula: formData.matricula.toUpperCase(),
        hora_entrada: new Date().toLocaleTimeString('es-AR'),
        fecha: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }]);
      
      setSuccess(true);
      toast.success(`✅ ${formData.nombre} registrado`);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setFormData({ tipo: "Medico", nombre: "", matricula: "", sin_tarjeta: false });
      }, 3000);
    } else {
      toast.error("Error al registrar");
    }
    
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-950 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-2">¡Registro exitoso!</h1>
          <p className="text-green-300 text-xl">Bienvenido al estacionamiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      {/* Header con ocupación */}
      <div className="bg-black/30 p-6 text-center border-b border-amber-500/20">
        <h1 className="text-4xl font-bold text-white mb-2">🅿️ Parking Morales</h1>
        <p className="text-slate-400">Sistema de auto-registro</p>
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{places.libres}</div>
            <div className="text-xs text-slate-400">Lugares libres</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{places.ocupados}</div>
            <div className="text-xs text-slate-400">Ocupados</div>
          </div>
        </div>
      </div>

      {/* Formulario táctil */}
      <div className="max-w-md mx-auto p-6 mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-white">¿Quién eres?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, tipo: "Medico" }); setStep(2); }}
                  className="p-6 bg-blue-600 rounded-2xl text-white text-xl font-semibold hover:bg-blue-700 transition"
                >
                  👨‍⚕️ Médico
                </button>
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, tipo: "Junta" }); setStep(2); }}
                  className="p-6 bg-purple-600 rounded-2xl text-white text-xl font-semibold hover:bg-purple-700 transition"
                >
                  🏛️ Junta
                </button>
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, tipo: "Reserva" }); setStep(2); }}
                  className="col-span-2 p-6 bg-green-600 rounded-2xl text-white text-xl font-semibold hover:bg-green-700 transition"
                >
                  ⭐ Reserva
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <button type="button" onClick={() => setStep(1)} className="text-amber-400 text-sm">
                ← Volver
              </button>
              
              <div>
                <label className="block text-white text-lg mb-2">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full text-2xl p-4 bg-slate-800 rounded-xl text-white text-center"
                  placeholder="Tu nombre"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-white text-lg mb-2">Matrícula</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                    className="flex-1 text-2xl p-4 bg-slate-800 rounded-xl text-white text-center uppercase"
                    placeholder="ABC 1234"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="px-6 bg-amber-600 rounded-xl text-white"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sin_tarjeta: !formData.sin_tarjeta })}
                  className={`flex-1 py-4 rounded-xl text-lg font-semibold ${formData.sin_tarjeta ? 'bg-red-600' : 'bg-slate-700'}`}
                >
                  {formData.sin_tarjeta ? '⚠️ Sin tarjeta' : '✅ Con tarjeta'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.nombre || !formData.matricula}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white text-2xl font-bold disabled:opacity-50"
              >
                {loading ? "Registrando..." : "INGRESAR"}
              </button>
            </div>
          )}
        </form>
      </div>

      {showCamera && (
        <CameraOCR
          onDetect={(matricula) => {
            setFormData({ ...formData, matricula });
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}