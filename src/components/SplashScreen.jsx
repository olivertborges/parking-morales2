// src/components/SplashScreen.jsx
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);
    
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      {/* Patrón de fondo sutil (opcional) */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="text-center relative z-10">
        {/* Logo con bordes redondeados y brillo */}
        <div className="relative">
          {/* Efecto de brillo exterior con colores que combinan con logo amarillo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
          
          {/* Contenedor del logo - fondo semi-transparente */}
          <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-3xl p-5 shadow-2xl border border-amber-500/20">
            <img 
              src="/splash.png" 
              alt="Parking Morales" 
              className="w-32 h-32 rounded-2xl object-cover"
            />
          </div>
        </div>
        
        {/* Título */}
        <div className="mt-6 space-y-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Parking Morales
          </h1>
          <p className="text-amber-400/80 text-sm font-medium">Sistema de Estacionamiento</p>
          
          {/* Puntos de carga animados */}
          <div className="flex justify-center gap-1 mt-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}