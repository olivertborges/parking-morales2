// src/pages/parking/ParkingPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

export default function ParkingPage() {
  const [spots, setSpots] = useState([]);
  const [spotsMap, setSpotsMap] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [medicos, setMedicos] = useState([]);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  const lugaresJunta = ["W2", "W3", "T2", "T3"];

  useEffect(() => {
    loadParking();
    loadActiveVehicles();

    const channel = supabase
      .channel("parking-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_assignments" }, () => {
        loadParking();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "active_vehicles" }, () => {
        loadActiveVehicles();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadParking() {
    const { data } = await supabase.from("parking_assignments").select("*");
    setSpots(data || []);
    const map = {};
    (data || []).forEach(spot => { map[spot.lugar] = spot; });
    setSpotsMap(map);
    renderParkingUI(data || []);
    updateStats(data || []);
  }

  async function loadActiveVehicles() {
    const { data } = await supabase
      .from("active_vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    setActiveVehicles(data || []);
  }

  function updateStats(spotsData) {
    const ocupados = spotsData.filter(s => s.activo).length;
    const libres = spotsData.filter(s => !s.activo).length;
    const total = spotsData.length;
    const porcentaje = total > 0 ? Math.round((ocupados / total) * 100) : 0;
    
    const libresEl = document.getElementById("libresCount");
    const ocupadosEl = document.getElementById("ocupadosCount");
    const porcentajeEl = document.getElementById("porcentajeCount");
    
    if (libresEl) libresEl.innerText = libres;
    if (ocupadosEl) ocupadosEl.innerText = ocupados;
    if (porcentajeEl) porcentajeEl.innerText = `${porcentaje}%`;
  }

  function shouldShowSpot(lugar, spot) {
    if (activeFilter === "todos") return true;
    if (activeFilter === "libres") return !spot?.activo;
    if (activeFilter === "ocupados") return spot?.activo;
    if (activeFilter === "medicos") return spot?.activo && spot?.tipo_medico === "Medico" || lugaresJunta.includes(lugar);
    if (activeFilter === "junta") return spot?.activo && spot?.tipo_medico === "Junta" || lugaresJunta.includes(lugar);
    return true;
  }

  const ordenVisual = {
    S: ["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12","S13","S14"],
    Z: ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9","Z10","Z11","Z12","Z13","Z14"],
    W: ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13"],
    T: ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12","T13"],
    especiales: ["X1","X2"]
  };

  const lugaresInvisibles = [
    "Z7","Z8","Z9","Z10","Z11",
    "W1","W4","W5","W6","W7",
    "T1","T4","T5","T6","T7","T11","T12","T13"
  ];

  function esLugarInvisible(lugar) {
    return lugaresInvisibles.includes(lugar);
  }

  function renderParkingUI(spotsData) {
    const map = {};
    spotsData.forEach(spot => { map[spot.lugar] = spot; });

    const colS = document.getElementById("col-s");
    const colZ = document.getElementById("col-z");
    const colW = document.getElementById("col-w");
    const colT = document.getElementById("col-t");
    const bottomXY = document.getElementById("bottom-xy");

    if (colS) renderColumn(colS, map, ordenVisual.S);
    if (colZ) renderColumn(colZ, map, ordenVisual.Z);
    if (colW) renderColumn(colW, map, ordenVisual.W);
    if (colT) renderColumn(colT, map, ordenVisual.T);
    if (bottomXY) renderColumn(bottomXY, map, ordenVisual.especiales);
  }

  function renderColumn(container, map, lugares) {
    if (!container) return;
    container.innerHTML = "";
    
    lugares.forEach(lugar => {
      const spot = map[lugar];
      const invisible = esLugarInvisible(lugar);
      const visiblePorFiltro = shouldShowSpot(lugar, spot);
      const esJunta = lugaresJunta.includes(lugar);
      
      const div = document.createElement("div");
      
      if (invisible) {
        div.className = "parking-spot invisible-spot";
        div.style.visibility = "hidden";
        div.style.opacity = "0";
        div.style.pointerEvents = "none";
        div.style.height = "70px";
        div.innerHTML = `<span class="spot-number" style="visibility:hidden">${lugar}</span>`;
      } else if (!visiblePorFiltro) {
        div.style.display = "none";
      } else {
        const occupied = spot?.activo || false;
        
        let spotClass = "parking-spot ";
        if (esJunta) {
          spotClass += "junta-spot";
        } else if (!occupied) {
          spotClass += "free";
        } else if (spot?.tipo_medico === "Junta") {
          spotClass += "junta";
        } else {
          spotClass += "occupied";
        }
        
        div.className = spotClass;
        div.setAttribute("data-lugar", lugar);
        
        let tooltipText = "";
        if (esJunta) {
          tooltipText = "🏛️ Lugar Junta Directiva";
        } else if (occupied) {
          tooltipText = spot.medico_nombre || "";
        }
        if (tooltipText) div.setAttribute("data-tooltip", tooltipText);
        
        div.onclick = () => openSpotModal(spot || { lugar, activo: false, esJunta });
        
        div.innerHTML = `
          <span class="spot-number">${lugar}</span>
          ${esJunta ? `<div class="spot-doctor"><i class="fas fa-gavel"></i> Junta</div>` : ""}
          ${!esJunta && occupied ? `<div class="spot-doctor"><i class="fas fa-user-md"></i> ${(spot.medico_nombre || "").split(" ")[0] || "Dr"}</div>` : ""}
        `;
      }
      
      container.appendChild(div);
    });
  }

  useEffect(() => {
    if (spots.length > 0) {
      const map = {};
      spots.forEach(spot => { map[spot.lugar] = spot; });
      
      const colS = document.getElementById("col-s");
      const colZ = document.getElementById("col-z");
      const colW = document.getElementById("col-w");
      const colT = document.getElementById("col-t");
      const bottomXY = document.getElementById("bottom-xy");
      
      if (colS) renderColumn(colS, map, ordenVisual.S);
      if (colZ) renderColumn(colZ, map, ordenVisual.Z);
      if (colW) renderColumn(colW, map, ordenVisual.W);
      if (colT) renderColumn(colT, map, ordenVisual.T);
      if (bottomXY) renderColumn(bottomXY, map, ordenVisual.especiales);
    }
  }, [activeFilter, spots]);

  function openSpotModal(spot) {
    setSelectedSpot(spot);
    setShowModal(true);
    setSearchTerm("");
  }

  function closeModal() {
    setShowModal(false);
    setSelectedSpot(null);
  }

  async function assignSpot(medico) {
    if (!selectedSpot) return;
    
    const { error } = await supabase
      .from("parking_assignments")
      .upsert({
        lugar: selectedSpot.lugar,
        activo: true,
        medico_nombre: medico.nombre,
        medico_matricula: medico.matricula,
        tipo_medico: selectedSpot.esJunta ? "Junta" : "Medico",
        vehiculo_id: medico.id,
        fecha_asignacion: new Date().toISOString().split('T')[0],
        hora_asignacion: new Date().toLocaleTimeString('es-AR')
      });
    
    if (!error) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "ASIGNAR_LUGAR", `${selectedSpot.lugar} → ${medico.nombre}`);
      toast.success(`✅ Lugar ${selectedSpot.lugar} asignado a ${medico.nombre}`);
      closeModal();
      loadParking();
    } else {
      toast.error(`❌ Error: ${error.message}`);
    }
  }

  async function freeSpot() {
    if (!selectedSpot) return;
    
    const { error } = await supabase
      .from("parking_assignments")
      .update({
        activo: false,
        vehiculo_id: null,
        medico_nombre: null,
        medico_matricula: null,
        tipo_medico: null
      })
      .eq("lugar", selectedSpot.lugar);
    
    if (!error) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "LIBERAR_LUGAR", `${selectedSpot.lugar} liberado`);
      toast.success(`✅ Lugar ${selectedSpot.lugar} liberado`);
      closeModal();
      loadParking();
    } else {
      toast.error(`❌ Error: ${error.message}`);
    }
  }

  const filteredVehicles = activeVehicles.filter(v =>
    v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="parking-virtual-container">
      {/* Header con logo */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="logo-universal">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Estacionamiento virtual</h2>
            <p className="text-sm text-slate-400">Distribución en tiempo real</p>
          </div>
        </div>
        
        <div className="stats-modernas flex gap-3">
          <div className="stat-card bg-slate-800/50 rounded-xl p-2 px-3 flex items-center gap-2">
            <span className="text-green-400 text-xl">🟢</span>
            <div>
              <div className="stat-value text-xl font-bold text-white" id="libresCount">0</div>
              <div className="stat-label text-[10px] text-slate-400">Libres</div>
            </div>
          </div>
          <div className="stat-card bg-slate-800/50 rounded-xl p-2 px-3 flex items-center gap-2">
            <span className="text-red-400 text-xl">🔴</span>
            <div>
              <div className="stat-value text-xl font-bold text-white" id="ocupadosCount">0</div>
              <div className="stat-label text-[10px] text-slate-400">Ocupados</div>
            </div>
          </div>
          <div className="stat-card bg-slate-800/50 rounded-xl p-2 px-3 flex items-center gap-2">
            <span className="text-amber-400 text-xl">📊</span>
            <div>
              <div className="stat-value text-xl font-bold text-white" id="porcentajeCount">0%</div>
              <div className="stat-label text-[10px] text-slate-400">Ocupación</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini mapa */}
      <div className="mini-map flex gap-2 justify-center my-4">
        {["S","Z","W","T","X/Y"].map(col => (
          <button key={col} onClick={() => {
            if (col === "X/Y") {
              const xySection = document.getElementById("xy-section");
              if (xySection) xySection.scrollIntoView({ behavior: "smooth" });
            } else {
              document.getElementById(`col-${col.toLowerCase()}`)?.scrollIntoView({ behavior: "smooth" });
            }
          }} className="mini-spot px-4 py-1 bg-slate-800 rounded-full text-sm hover:bg-amber-500 transition">
            {col}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="filtros-rapidos flex gap-2 flex-wrap justify-center mb-5">
        {[
          { key: "todos", label: "🎯 Todos" },
          { key: "medicos", label: "👨‍⚕️ Médicos" },
          { key: "junta", label: "🏛️ Junta" },
          { key: "libres", label: "🟢 Libres" },
          { key: "ocupados", label: "🔴 Ocupados" }
        ].map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)} className={`px-3 py-1 rounded-full text-xs transition ${activeFilter === f.key ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-400"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Mapa */}
      <div className="parking-map-premium bg-slate-900/30 backdrop-blur rounded-2xl p-4 border border-amber-500/20">
        <div className="parking-title-row flex justify-around mb-3">
          {["S","Z","W","T"].map(col => (
            <div key={col} className="col-label text-amber-500 font-bold text-sm">{col}</div>
          ))}
        </div>

        <div className="parking-columns flex justify-around gap-4 flex-wrap">
          <div id="col-s" className="parking-col w-20 flex flex-col gap-2"></div>
          <div id="col-z" className="parking-col w-20 flex flex-col gap-2"></div>
          <div id="col-w" className="parking-col w-20 flex flex-col gap-2"></div>
          <div id="col-t" className="parking-col w-20 flex flex-col gap-2"></div>
        </div>

        {/* Zona de lugares especiales */}
        <div id="xy-section" className="parking-bottom-premium mt-5 pt-3">
          <div className="bottom-label text-amber-500 text-xs mb-2 text-center">📍 LUGARES ESPECIALES</div>
          <div className="flex items-center justify-start gap-3">
            <div id="bottom-xy" className="flex gap-3"></div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="parking-legend-premium flex justify-center gap-4 mt-4 text-xs flex-wrap">
        <div className="legend-item flex items-center gap-1"><span className="legend-box w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500"></span> Libre</div>
        <div className="legend-item flex items-center gap-1"><span className="legend-box w-3 h-3 rounded bg-red-500/30 border border-red-500"></span> Ocupado</div>
        <div className="legend-item flex items-center gap-1"><span className="legend-box w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-orange-600"></span> Junta Directiva</div>
        <div className="legend-item flex items-center gap-1">🖱️ Click para asignar</div>
      </div>

      {/* Modal */}
      {showModal && selectedSpot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Lugar {selectedSpot.lugar}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4">
              {selectedSpot.activo ? (
                <div>
                  <p className="text-white mb-2">Ocupado por:</p>
                  <p className="text-amber-400 font-semibold">{selectedSpot.medico_nombre}</p>
                  <p className="text-slate-400 text-sm">{selectedSpot.medico_matricula}</p>
                  <button onClick={freeSpot} className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl transition">Dar salida</button>
                </div>
              ) : (
                <div>
                  <p className="text-white mb-3">Seleccionar médico:</p>
                  <input type="text" placeholder="Buscar médico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-700 rounded-lg p-2 mb-3 text-white" />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredVehicles.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No hay vehículos dentro del estacionamiento</p>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <div key={vehicle.id} onClick={() => assignSpot(vehicle)} className="bg-slate-700 p-3 rounded-lg cursor-pointer hover:bg-amber-500/20 transition">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{vehicle.nombre}</p>
                              <p className="text-slate-400 text-xs">{vehicle.matricula}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{vehicle.tipo}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}