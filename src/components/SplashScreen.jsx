// src/components/SplashScreen.jsx
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="text-center">
        {/* Logo con bordes redondeados y brillo */}
        <div className="relative">
          {/* Efecto de brillo exterior */}
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
          
          {/* Contenedor del logo */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-4 shadow-2xl">
            <img 
              src="/splash.png" 
              alt="Logo" 
              className="w-28 h-28 rounded-2xl object-cover"
            />
          </div>
        </div>
        
        {/* Texto de carga */}
        <div className="mt-6 space-y-2">
          <h1 className="text-2xl font-bold text-white">Parking Morales</h1>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    </div>
  );
}