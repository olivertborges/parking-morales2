// src/pages/parking/ParkingPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { X, Search, LogOut, Move, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function ParkingPage() {
  const [spotsMap, setSpotsMap] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modoMover, setModoMover] = useState(false);
  const [vehiculoAMover, setVehiculoAMover] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');


  useEffect(() => {
    loadParking();
    loadActiveVehicles();

    const channel = supabase
      .channel("parking-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "parking_assignments" }, () => { loadParking(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "active_vehicles" }, () => { loadActiveVehicles(); })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
  if (Object.keys(spotsMap).length > 0) {
    renderizarParking(spotsMap);
  }
}, [activeFilter]);

  async function loadParking() {
    const { data } = await supabase.from("parking_assignments").select("*");
    const map = {};
    data?.forEach(spot => { map[spot.lugar] = spot; });
    setSpotsMap(map);
    renderizarParking(map);
    actualizarStats(data || []);
  }

  async function loadActiveVehicles() {
    const { data } = await supabase.from("active_vehicles").select("*");
    setActiveVehicles(data || []);
  }

  const lugaresInvisibles = [
    "Z7","Z8","Z9","Z10","Z11",
    "W1","W4","W5","W6","W7","W8",
    "T1","T4","T5","T6","T7","T8","T12","T13","T14"
  ];

  function esInvisible(lugar) { return lugaresInvisibles.includes(lugar); }

  function renderizarParking(spotsMap) {
    const colS = document.getElementById("col-s");
    const colZ = document.getElementById("col-z");
    const colW = document.getElementById("col-w");
    const colT = document.getElementById("col-t");
    const bottomXY = document.getElementById("bottom-xy");

    const lugaresS = ["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12","S13","S14"];
    const lugaresZ = ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9","Z10","Z11","Z12","Z13","Z14"];
    const lugaresW = ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12","W13","W14"];
    const lugaresT = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12","T13","T14"];
    const lugaresXY = ["X1","X2"];
    const lugaresEspeciales = ["W2", "W3", "T2", "T3"];

    if (colS) renderColumna(colS, lugaresS, spotsMap);
    if (colZ) renderColumna(colZ, lugaresZ, spotsMap);
    if (colW) renderColumna(colW, lugaresW, spotsMap);
    if (colT) renderColumna(colT, lugaresT, spotsMap);
    if (bottomXY) renderColumna(bottomXY, lugaresXY, spotsMap);
  }

function renderColumna(container, lugares, spotsMap) {
  if (!container) return;
  container.innerHTML = "";
  
  lugares.forEach(lugar => {
    const spot = spotsMap[lugar];
    const invisible = esInvisible(lugar);
    const ocupado = spot?.activo === true;
    const esJunta = spot?.tipo_medico === "Junta";
    
    // 👈 APLICAR FILTRO
    let mostrar = true;
    if (activeFilter === 'libres' && ocupado) mostrar = false;
    if (activeFilter === 'ocupados' && !ocupado) mostrar = false;
    if (activeFilter === 'medicos' && (!ocupado || esJunta)) mostrar = false;
    if (activeFilter === 'junta' && (!ocupado || !esJunta)) mostrar = false;
    
    const div = document.createElement("div");
    
    if (invisible || !mostrar) {
      if (invisible) {
        div.className = "parking-spot invisible-spot";
        div.style.visibility = "hidden";
        div.style.opacity = "0";
        div.style.pointerEvents = "none";
        div.style.height = "70px";
        div.innerHTML = `<span class="spot-number" style="visibility:hidden">${lugar}</span>`;
      } else {
        div.style.display = "none";
      }
    } else {
      let colorClass = ocupado ? (esJunta ? "junta" : "occupied") : "free";
      div.className = `parking-spot ${colorClass}`;
      div.setAttribute("data-lugar", lugar);
      if (ocupado) div.setAttribute("data-tooltip", `${spot?.medico_nombre || ""} - ${spot?.medico_matricula || ""}`);
      
      div.onclick = () => {
        if (modoMover && vehiculoAMover) {
          moverALugar(spot);
        } else {
          setSelectedSpot(spot || { lugar, activo: false });
          setShowModal(true);
        }
      };
      
      div.innerHTML = `
        <span class="spot-number">${lugar}</span>
        ${ocupado ? `<div class="spot-doctor"><i class="fas fa-user-md"></i> ${(spot?.medico_nombre || "").split(" ")[0]}</div>` : ""}
      `;
    }
    container.appendChild(div);
  });
}

async function asignarLugar(vehicle) {
  if (!selectedSpot || asignando) return;
  
  setAsignando(true);
  
  const toastId = toast.loading(`Asignando lugar ${selectedSpot.lugar}...`);
  
  try {
    const ahora = new Date();
    const horaAsignacion = ahora.toLocaleTimeString('es-AR');
    const fechaAsignacion = ahora.toISOString().split('T')[0];
    
    // Verificar que el lugar sigue libre
    const { data: lugarActual, error: checkError } = await supabase
      .from("parking_assignments")
      .select("activo")
      .eq("lugar", selectedSpot.lugar)
      .single();
    
    if (checkError) {
      console.error("Error verificando lugar:", checkError);
    }
    
    if (lugarActual?.activo === true) {
      toast.error(`❌ El lugar ${selectedSpot.lugar} ya fue ocupado`, { id: toastId });
      setAsignando(false);
      return;
    }
    
    // Primero, si el vehículo ya tenía otro lugar, liberarlo
    const { data: lugarAnterior } = await supabase
      .from("parking_assignments")
      .select("id, lugar")
      .eq("vehiculo_id", vehicle.id)
      .eq("activo", true)
      .single();
    
    if (lugarAnterior) {
      await supabase
        .from("parking_assignments")
        .update({ activo: false, medico_nombre: null, medico_matricula: null, vehiculo_id: null })
        .eq("id", lugarAnterior.id);
      console.log(`📍 Lugar anterior ${lugarAnterior.lugar} liberado`);
    }
    
    // Asignar el nuevo lugar
    const { error } = await supabase
      .from("parking_assignments")
      .upsert({
        lugar: selectedSpot.lugar,
        activo: true,
        medico_nombre: vehicle.nombre,
        medico_matricula: vehicle.matricula,
        tipo_medico: vehicle.tipo,
        vehiculo_id: vehicle.id,
        fecha_asignacion: fechaAsignacion,
        hora_asignacion: horaAsignacion
      });
    
    if (error) throw error;
    
    toast.success(`✅ Lugar ${selectedSpot.lugar} asignado a ${vehicle.nombre}`, { id: toastId });
    setShowModal(false);
    await loadParking();
    await loadActiveVehicles();
    
  } catch (error) {
    console.error("Error en asignación:", error);
    toast.error(`❌ Error: ${error.message}`, { id: toastId });
  } finally {
    setAsignando(false);
  }
}


function aplicarFiltro(filtro) {
  console.log("Filtro seleccionado:", filtro);
  setActiveFilter(filtro);
}
  async function liberarLugar(spot) {
    if (!spot || !spot.activo) return;
    
    const { error } = await supabase
      .from("parking_assignments")
      .update({ activo: false, medico_nombre: null, medico_matricula: null, vehiculo_id: null })
      .eq("id", spot.id);
    
    if (!error) {
      toast.success(`📍 Lugar ${spot.lugar} liberado`);
      setShowModal(false);
      loadParking();
    } else {
      toast.error(`❌ Error: ${error.message}`);
    }
  }

  async function darSalida(spot) {
    if (!spot || !spot.activo) return;
    
    const horaSalida = new Date().toLocaleTimeString('es-AR');
    const fechaSalida = new Date().toISOString().split('T')[0];
    
    await supabase
      .from("parking_assignments")
      .update({ activo: false, medico_nombre: null, medico_matricula: null, vehiculo_id: null })
      .eq("id", spot.id);
    
    await supabase
      .from("active_vehicles")
      .delete()
      .eq("id", spot.vehiculo_id);
    
    await supabase
      .from("history")
      .update({ hora_salida: horaSalida, fecha_salida: fechaSalida })
      .eq("nombre", spot.medico_nombre)
      .eq("matricula", spot.medico_matricula)
      .is("hora_salida", null);
    
    toast.success(`✅ ${spot.medico_nombre} salió del estacionamiento`);
    setShowModal(false);
    loadParking();
    loadActiveVehicles();
  }

  async function iniciarMover(spot) {
    setVehiculoAMover({
      id: spot.vehiculo_id,
      nombre: spot.medico_nombre,
      matricula: spot.medico_matricula,
      tipo: spot.tipo_medico
    });
    setModoMover(true);
    setShowModal(false);
    toast.success(`🔁 Selecciona el nuevo lugar para ${spot.medico_nombre}`);
  }

  async function moverALugar(nuevoSpot) {
    if (!vehiculoAMover) return;
    if (nuevoSpot.activo === true) {
      toast.error(`❌ El lugar ${nuevoSpot.lugar} ya está ocupado`);
      return;
    }
    
    const ahora = new Date();
    const horaAsignacion = ahora.toLocaleTimeString('es-AR');
    const fechaAsignacion = ahora.toISOString().split('T')[0];
    
    // 1. Liberar lugar anterior
    await supabase
      .from("parking_assignments")
      .update({ activo: false, medico_nombre: null, medico_matricula: null, vehiculo_id: null })
      .eq("vehiculo_id", vehiculoAMover.id);
    
    // 2. Ocupar nuevo lugar
    const { error } = await supabase
      .from("parking_assignments")
      .upsert({
        lugar: nuevoSpot.lugar,
        activo: true,
        medico_nombre: vehiculoAMover.nombre,
        medico_matricula: vehiculoAMover.matricula,
        tipo_medico: vehiculoAMover.tipo,
        vehiculo_id: vehiculoAMover.id,
        fecha_asignacion: fechaAsignacion,
        hora_asignacion: horaAsignacion
      });
    
    if (!error) {
      toast.success(`🚗 ${vehiculoAMover.nombre} movido a lugar ${nuevoSpot.lugar}`);
      setModoMover(false);
      setVehiculoAMover(null);
      loadParking();
    } else {
      toast.error(`❌ Error: ${error.message}`);
    }
  }

  function cancelarMover() {
    setModoMover(false);
    setVehiculoAMover(null);
    toast.info("Movimiento cancelado");
  }

  function actualizarStats(spotsData) {
    const ocupados = spotsData.filter(s => s.activo === true).length;
    const libres = spotsData.length - ocupados;
    const porcentaje = spotsData.length > 0 ? Math.round((ocupados / spotsData.length) * 100) : 0;
    
    const libresEl = document.getElementById("libresCount");
    const ocupadosEl = document.getElementById("ocupadosCount");
    const porcentajeEl = document.getElementById("porcentajeCount");
    
    if (libresEl) libresEl.innerText = libres;
    if (ocupadosEl) ocupadosEl.innerText = ocupados;
    if (porcentajeEl) porcentajeEl.innerText = `${porcentaje}%`;
  }

  const filteredVehicles = activeVehicles.filter(v =>
    v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function scrollToCol(colId) { document.getElementById(colId)?.scrollIntoView({ behavior: "smooth" }); }
  function scrollToBottom() { window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight }); }

  return (

    
    <div id="parkingVirtualSection" className="page-section">
      {/* Header */}
      <div className="parking-header-premium">
        <div className="parking-title-premium">
          <div className="logo-universal" style={{ margin: 0 }}><img src="/seguridad.png" alt="Logo" style={{ height: "45px" }} /></div>
          <div><h2>Parking Virtual</h2><p>Distribución en tiempo real</p></div>
        </div>
        <div className="stats-modernas">
          <div className="stat-card"><div className="stat-icon">🟢</div><div className="stat-value" id="libresCount">0</div><div className="stat-label">Libres</div></div>
          <div className="stat-card"><div className="stat-icon">🔴</div><div className="stat-value" id="ocupadosCount">0</div><div className="stat-label">Ocupados</div></div>
          <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value" id="porcentajeCount">0%</div><div className="stat-label">Ocupación</div></div>
        </div>
      </div>

      {/* Mini-mapa */}
      <div className="mini-map">
        <div className="mini-spot" onClick={() => scrollToCol('col-s')}>S</div>
        <div className="mini-spot" onClick={() => scrollToCol('col-z')}>Z</div>
        <div className="mini-spot" onClick={() => scrollToCol('col-w')}>W</div>
        <div className="mini-spot" onClick={() => scrollToCol('col-t')}>T</div>
        <div className="mini-spot" onClick={() => scrollToBottom()}>X/Y</div>
      </div>

      {/* Filtros */}
        <div className="filtros-rapidos">
        <button className={`filtro-btn ${activeFilter === 'todos' ? 'active' : ''}`} onClick={() => aplicarFiltro('todos')}>🎯 Todos</button>
        <button className={`filtro-btn ${activeFilter === 'medicos' ? 'active' : ''}`} onClick={() => aplicarFiltro('medicos')}>👨‍⚕️ Médicos</button>
        <button className={`filtro-btn ${activeFilter === 'junta' ? 'active' : ''}`} onClick={() => aplicarFiltro('junta')}>🏛️ Junta</button>
        <button className={`filtro-btn ${activeFilter === 'libres' ? 'active' : ''}`} onClick={() => aplicarFiltro('libres')}>🟢 Libres</button>
        <button className={`filtro-btn ${activeFilter === 'ocupados' ? 'active' : ''}`} onClick={() => aplicarFiltro('ocupados')}>🔴 Ocupados</button>
        </div>

      {/* Modo mover activo - indicador */}
      {modoMover && (
        <div className="bg-amber-500/20 border border-amber-500 rounded-xl p-3 mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Move className="w-5 h-5 text-amber-400" />
            <span className="text-white text-sm">Moviendo a <strong>{vehiculoAMover?.nombre}</strong> - Haz clic en un lugar libre</span>
          </div>
          <button onClick={cancelarMover} className="text-red-400 text-sm hover:text-red-300">Cancelar</button>
        </div>
      )}

      {/* Mapa */}
      <div className="parking-map-premium">
        <div className="parking-title-row"><div className="col-label">S</div><div className="col-label">Z</div><div className="col-label">W</div><div className="col-label">T</div></div>
        <div className="parking-columns">
          <div className="parking-col" id="col-s"></div>
          <div className="parking-col" id="col-z"></div>
          <div className="parking-col" id="col-w"></div>
          <div className="parking-col" id="col-t"></div>
        </div>
        <div className="parking-bottom-premium"><div className="bottom-label">📍 LUGARES ESPECIALES</div><div className="bottom-spots" id="bottom-xy"></div></div>
      </div>

      {/* Leyenda */}
      <div className="parking-legend-premium">
        <div className="legend-item"><span className="legend-box free-box"></span> Libre</div>
        <div className="legend-item"><span className="legend-box occupied-box"></span> Ocupado</div>
        <div className="legend-item"><span className="legend-box junta-box"></span> Junta Directiva</div>
        <div className="legend-item"><i className="fas fa-arrows-alt"></i> Click para asignar</div>
      </div>

      {/* MODAL */}
      {showModal && selectedSpot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-2xl">
            <div className={`rounded-t-2xl p-5 ${selectedSpot.activo ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    {selectedSpot.activo ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedSpot.activo ? 'Estacionamiento ocupado' : 'Asignar lugar'}</h3>
                    <p className="text-white/70 text-sm">Lugar {selectedSpot.lugar}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {selectedSpot.activo ? (
                <div className="space-y-4">
                  {/* Información del médico */}
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div><p className="text-slate-400 text-xs">Médico</p><p className="text-white font-semibold text-lg">{selectedSpot.medico_nombre}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20" /></svg>
                      </div>
                      <div><p className="text-slate-400 text-xs">Matrícula</p><p className="text-white font-mono font-semibold">{selectedSpot.medico_matricula}</p></div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button onClick={() => liberarLugar(selectedSpot)} className="flex-1 bg-slate-600 hover:bg-slate-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition">
                      <RefreshCw className="w-5 h-5" />
                      Liberar lugar
                    </button>
                    <button onClick={() => darSalida(selectedSpot)} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition">
                      <LogOut className="w-5 h-5" />
                      Dar salida
                    </button>
                  </div>

                  <button onClick={() => iniciarMover(selectedSpot)} className="w-full bg-amber-600 hover:bg-amber-700 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition">
                    <Move className="w-5 h-5" />
                    Mover a otro lugar
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-white mb-3 flex items-center gap-2">Seleccionar vehículo dentro:</p>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar por nombre o matrícula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-700 rounded-lg py-2 pl-10 pr-3 text-white" />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredVehicles.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No hay vehículos dentro</p>
                    ) : (
                    filteredVehicles.map((v) => (
                        <div
                        key={v.id}
                        onClick={() => asignarLugar(v)}
                        className={`bg-slate-700 p-3 rounded-lg cursor-pointer transition ${
                            asignando ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-500/20'
                        }`}
                        >
                        <p className="text-white font-medium">{v.nombre}</p>
                        <p className="text-slate-400 text-sm">{v.matricula}</p>
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