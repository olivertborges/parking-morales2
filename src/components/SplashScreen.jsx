// src/components/SplashScreen.jsx
import { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);
    
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 4500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <img 
        src="/splash.png" 
        alt="Parking Morales" 
        className="w-40 h-40 rounded-3xl"
        style={{
          borderRadius: '24px',
          boxShadow: '0 0 15px #f59e0b, 0 0 30px #f59e0b, 0 0 45px #f59e0b',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
    </div>
  );
}