// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { LogIn, User, Lock } from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");  // 👈 Cambiado de email a usuario
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!usuario.trim() || !password.trim()) {
      setError("Usuario y contraseña son obligatorios");
      setLoading(false);
      return;
    }

    try {
      // Buscar en la tabla users por el campo "usuario" (username)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("usuario", usuario)  // 👈 Busca por usuario, no por email
        .single();

      if (userError || !userData) {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      // Verificar contraseña
      if (userData.password !== password) {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      // Guardar usuario en localStorage
      localStorage.setItem("user", JSON.stringify({
        id: userData.id,
        usuario: userData.usuario,
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol
      }));

      // Redirigir al dashboard
      navigate("/");
      
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="logo-universal-login">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Parking Morales</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema Profesional de Estacionamiento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo USUARIO */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-1">
              <User className="w-3 h-3" /> Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition"
              placeholder="Ingrese su usuario"
              required
            />
          </div>

          {/* Campo CONTRASEÑA */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition"
              placeholder="••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg transition"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Sistema conectado a Supabase Cloud
          </p>
        </div>
      </div>
    </div>
  );
}