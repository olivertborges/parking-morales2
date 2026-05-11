// src/pages/tv/TVPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function TVPage() {
  const [spots, setSpots] = useState([]);
  const [spotsMap, setSpotsMap] = useState({});
  const [stats, setStats] = useState({ libres: 0, ocupados: 0, porcentaje: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Misma disposición que tu Parking Virtual
  const ordenVisual = {
    S: ["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12","S13","S14"],
    Z: ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9","Z10","Z11","Z12","Z13","Z14"],
    W: ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13"],
    T: ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12","T13"],
    especiales: ["X1","X2"]
  };

  // Lugares invisibles (ocupan espacio pero no se ven)
  const lugaresInvisibles = [
    "Z7","Z8","Z9","Z10","Z11",
    "W1","W4","W5","W6","W7",
    "T1","T4","T5","T6","T7","T11","T12","T13"
  ];

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

async function loadData() {
  const { data } = await supabase.from("parking_assignments").select("*");
  if (data) {
    const map = {};
    data.forEach(spot => { map[spot.lugar] = spot; });
    setSpotsMap(map);
    setSpots(data);
    
    // CONTAR SOLO LUGARES VISIBLES (no invisibles)
    const lugaresVisibles = data.filter(spot => !esLugarInvisible(spot.lugar));
    const ocupados = lugaresVisibles.filter(s => s.activo === true).length;
    const totalVisibles = lugaresVisibles.length;
    const libres = totalVisibles - ocupados;
    
    console.log("Total lugares visibles:", totalVisibles);
    console.log("Ocupados:", ocupados);
    console.log("Libres:", libres);
    
    setStats({ 
      libres, 
      ocupados, 
      total: totalVisibles,
      porcentaje: totalVisibles > 0 ? Math.round((ocupados / totalVisibles) * 100) : 0
    });
  }
}

function esLugarInvisible(lugar) {
  const lugaresInvisibles = [
    "Z7","Z8","Z9","Z10","Z11",
    "W1","W4","W5","W6","W7",
    "T1","T4","T5","T6","T7","T11","T12","T13"
  ];
  return lugaresInvisibles.includes(lugar);
}

  function getSpotStatus(lugar) {
    const spot = spotsMap[lugar];
    return {
      exists: !!spot,
      occupied: spot?.activo === true,
      nombre: spot?.medico_nombre,
      matricula: spot?.medico_matricula
    };
  }

const formatHora = () => {
  return currentTime.toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

  const formatFecha = () => {
    return currentTime.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // src/pages/tv/TVPage.jsx - Agregar esta función de debug

function debugLugares(data) {
  console.log("=== DEBUG LUGARES ===");
  console.log("Total lugares en BD:", data.length);
  
  const lugaresInvisibles = [
    "Z7","Z8","Z9","Z10","Z11",
    "W1","W4","W5","W6","W7",
    "T1","T4","T5","T6","T7","T11","T12","T13"
  ];
  
  // Contar por columna
  const colS = data.filter(s => s.lugar?.startsWith("S"));
  const colZ = data.filter(s => s.lugar?.startsWith("Z"));
  const colW = data.filter(s => s.lugar?.startsWith("W"));
  const colT = data.filter(s => s.lugar?.startsWith("T"));
  const especiales = data.filter(s => s.lugar === "X1" || s.lugar === "X2");
  
  console.log("S:", colS.length, colS.map(s => s.lugar));
  console.log("Z:", colZ.length, colZ.map(s => s.lugar));
  console.log("W:", colW.length, colW.map(s => s.lugar));
  console.log("T:", colT.length, colT.map(s => s.lugar));
  console.log("Especiales:", especiales.length, especiales.map(s => s.lugar));
  
  // Contar visibles
  const visibles = data.filter(spot => !lugaresInvisibles.includes(spot.lugar));
  console.log("Visibles:", visibles.length);
  console.log("Invisibles:", data.length - visibles.length);
  
  return visibles.length;
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-1">Parking Morales</h1>
        <p className="text-sm text-slate-400">Estado del estacionamiento en tiempo real</p>
      </div>

      {/* Estadísticas */}
        <div className="flex justify-center gap-6 mb-6">
        <div className="text-center bg-slate-800/50 rounded-xl px-6 py-2 border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{stats.libres}</div>
            <div className="text-xs text-slate-400">Libres</div>
        </div>
        <div className="text-center bg-slate-800/50 rounded-xl px-6 py-2 border border-red-500/30">
            <div className="text-2xl font-bold text-red-400">{stats.ocupados}</div>
            <div className="text-xs text-slate-400">Ocupados</div>
        </div>
        <div className="text-center bg-slate-800/50 rounded-xl px-6 py-2 border border-amber-500/30">
            <div className="text-2xl font-bold text-amber-400">{stats.porcentaje}%</div>
            <div className="text-xs text-slate-400">Ocupación</div>
        </div>
        </div>

      {/* MAPA - MISMA DISPOSICIÓN QUE PARKING VIRTUAL */}
      <div className="max-w-6xl mx-auto bg-slate-900/30 backdrop-blur rounded-2xl p-4 border border-amber-500/20">
        {/* Título de columnas */}
        <div className="grid grid-cols-4 gap-4 mb-3">
          <div className="col-label text-center font-bold text-amber-500 text-lg">S</div>
          <div className="col-label text-center font-bold text-amber-500 text-lg">Z</div>
          <div className="col-label text-center font-bold text-amber-500 text-lg">W</div>
          <div className="col-label text-center font-bold text-amber-500 text-lg">T</div>
        </div>

        {/* Columnas */}
        <div className="grid grid-cols-4 gap-4">
          {/* Columna S */}
          <ColumnSpots 
            lugares={ordenVisual.S} 
            getStatus={getSpotStatus} 
            esInvisible={esLugarInvisible}
          />
          {/* Columna Z */}
          <ColumnSpots 
            lugares={ordenVisual.Z} 
            getStatus={getSpotStatus} 
            esInvisible={esLugarInvisible}
          />
          {/* Columna W */}
          <ColumnSpots 
            lugares={ordenVisual.W} 
            getStatus={getSpotStatus} 
            esInvisible={esLugarInvisible}
          />
          {/* Columna T */}
          <ColumnSpots 
            lugares={ordenVisual.T} 
            getStatus={getSpotStatus} 
            esInvisible={esLugarInvisible}
          />
        </div>

        {/* Lugares especiales X1, X2 */}
        <div className="mt-6 pt-3 border-t border-amber-500/30">
          <div className="text-center text-amber-400 text-xs mb-2 tracking-wider">📍 LUGARES ESPECIALES</div>
          <div className="flex justify-start gap-3">
            {ordenVisual.especiales.map((lugar) => {
              const status = getSpotStatus(lugar);
              const invisible = esLugarInvisible(lugar);
              
              if (invisible) return null;
              
              return (
                <div
                  key={lugar}
                  className={`w-20 p-2 rounded-xl text-center ${
                    status.occupied 
                      ? 'bg-red-500/30 border border-red-500 text-red-400' 
                      : 'bg-emerald-500/30 border border-emerald-500 text-emerald-400'
                  }`}
                >
                  <div className="font-bold text-base">{lugar}</div>
                  {status.occupied && status.nombre && (
                    <div className="text-[10px] text-white truncate">
                      {status.nombre.split(" ")[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fecha y hora */}
      <div className="fixed bottom-2 right-3 text-right">
        <div className="text-2xl font-mono text-white font-bold bg-black/30 px-3 py-1 rounded-lg backdrop-blur">
          {formatHora()}
        </div>
        <div className="text-[10px] text-slate-400">
          {formatFecha()}
        </div>
      </div>

      {/* Logo */}
      <div className="fixed bottom-2 left-3">
        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg backdrop-blur">
          <div className="w-5 h-5 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="text-white text-xs font-semibold">Parking Morales</span>
        </div>
      </div>
    </div>
  );
}

// Componente para cada columna
function ColumnSpots({ lugares, getStatus, esInvisible }) {
  return (
    <div className="bg-slate-800/20 rounded-xl p-2">
      <div className="flex flex-col gap-1 max-h-[65vh] overflow-y-auto">
        {lugares.map((lugar) => {
          const status = getStatus(lugar);
          const invisible = esInvisible(lugar);
          
          // Si es invisible, mostrar un div vacío que ocupa espacio
          if (invisible) {
            return (
              <div
                key={lugar}
                className="p-2 rounded-lg opacity-0 pointer-events-none"
                style={{ height: "52px" }}
              />
            );
          }
          
          return (
            <div
              key={lugar}
              className={`p-2 rounded-lg text-center ${
                status.occupied 
                  ? 'bg-red-500/30 border border-red-500 text-red-400' 
                  : 'bg-emerald-500/30 border border-emerald-500 text-emerald-400'
              }`}
            >
              <div className="font-bold text-sm">{lugar}</div>
              {status.occupied && status.nombre && (
                <div className="text-[10px] text-white truncate">
                  {status.nombre.split(" ")[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}