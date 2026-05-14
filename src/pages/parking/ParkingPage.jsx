// src/pages/parking/ParkingPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { X, Search, LogOut, Move, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

export default function ParkingPage() {
  const [spotsMap, setSpotsMap] = useState({});
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modoMover, setModoMover] = useState(false);
  const [vehiculoAMover, setVehiculoAMover] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [activeFilter, setActiveFilter] = useState("todos");

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
      const habilitado = spot?.habilitado !== false;
      const ocupado = spot?.activo === true && habilitado;
      const deshabilitado = !habilitado;
      const esJunta = spot?.tipo_medico === "Junta";
      const nombreDoctor = spot?.medico_nombre || "";
      
      let mostrar = true;
      if (activeFilter === 'libres' && ocupado) mostrar = false;
      if (activeFilter === 'ocupados' && !ocupado) mostrar = false;
      if (activeFilter === 'medicos' && (!ocupado || esJunta)) mostrar = false;
      if (activeFilter === 'junta' && (!ocupado || !esJunta)) mostrar = false;
      
      if (!mostrar) return;
      
      const div = document.createElement("div");
      
      if (invisible) {
        div.className = "parking-spot invisible-spot";
        div.style.visibility = "hidden";
        div.style.opacity = "0";
        div.style.pointerEvents = "none";
        div.style.height = "70px";
        div.innerHTML = `<span class="spot-number" style="visibility:hidden">${lugar}</span>`;
      } else if (deshabilitado) {
        div.className = "parking-spot disabled";
        div.onclick = () => {
          setSelectedSpot(spot || { lugar, activo: false, habilitado: false });
          setShowModal(true);
        };
        div.innerHTML = `
          <span class="spot-number" style="color: #94a3b8">${lugar}</span>
          <div class="spot-doctor" style="color: #64748b">🚫 Deshabilitado</div>
        `;
      } else {
        let colorClass = ocupado ? (esJunta ? "junta" : "occupied") : "free";
        div.className = `parking-spot ${colorClass}`;
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
          ${ocupado ? `<div class="spot-doctor"><i class="fas fa-user-md"></i> ${(nombreDoctor || "").split(" ")[0]}</div>` : ""}
        `;
      }
      container.appendChild(div);
    });
  }

  function actualizarStats(spotsData) {
    const lugaresVisibles = spotsData.filter(s => !lugaresInvisibles.includes(s.lugar));
    const ocupados = lugaresVisibles.filter(s => s.activo === true && s.habilitado !== false).length;
    const libres = lugaresVisibles.filter(s => s.activo === false && s.habilitado !== false).length;
    const bloqueados = lugaresVisibles.filter(s => s.habilitado === false).length;
    const totalVisibles = lugaresVisibles.length;
    const porcentaje = (ocupados + libres) > 0 ? Math.round((ocupados / (ocupados + libres)) * 100) : 0;
    
    const libresEl = document.getElementById("libresCount");
    const ocupadosEl = document.getElementById("ocupadosCount");
    const porcentajeEl = document.getElementById("porcentajeCount");
    const bloqueadosEl = document.getElementById("deshabilitadosCount");
    
    if (libresEl) libresEl.innerText = libres;
    if (ocupadosEl) ocupadosEl.innerText = ocupados;
    if (porcentajeEl) porcentajeEl.innerText = `${porcentaje}%`;
    if (bloqueadosEl) bloqueadosEl.innerText = bloqueados;
  }

  async function toggleHabilitarLugar(spot) {
    if (!spot) return;
    const nuevoEstado = spot.habilitado === false ? true : false;
    const { error } = await supabase.from("parking_assignments").update({ habilitado: nuevoEstado }).eq("id", spot.id);
    if (!error) {
      toast.success(`📍 Lugar ${spot.lugar} ${nuevoEstado ? 'habilitado' : 'deshabilitado'}`);
      loadParking();
    }
  }

  async function asignarLugar(vehicle) {
    if (!selectedSpot || asignando) return;
    setAsignando(true);
    const ahora = new Date();
    const horaAsignacion = ahora.toLocaleTimeString('es-AR');
    const fechaAsignacion = ahora.toISOString().split('T')[0];
    
    const { error } = await supabase
      .from("parking_assignments")
      .update({
        activo: true,
        medico_nombre: vehicle.nombre,
        medico_matricula: vehicle.matricula,
        tipo_medico: vehicle.tipo,
        vehiculo_id: vehicle.id,
        fecha_asignacion: fechaAsignacion,
        hora_asignacion: horaAsignacion,
        habilitado: true
      })
      .eq("id", selectedSpot.id);
    
    if (!error) {
      toast.success(`✅ Lugar ${selectedSpot.lugar} asignado a ${vehicle.nombre}`);
      setShowModal(false);
      loadParking();
    }
    setAsignando(false);
  }

  async function liberarLugar(spot) {
    const { error } = await supabase.from("parking_assignments").update({ activo: false, medico_nombre: null }).eq("id", spot.id);
    if (!error) {
      toast.success(`📍 Lugar ${spot.lugar} liberado`);
      setShowModal(false);
      loadParking();
    }
  }

  async function darSalida(spot) {
    const horaSalida = new Date().toLocaleTimeString('es-AR');
    await supabase.from("parking_assignments").update({ activo: false }).eq("id", spot.id);
    await supabase.from("active_vehicles").delete().eq("id", spot.vehiculo_id);
    await supabase.from("history").update({ hora_salida: horaSalida }).eq("nombre", spot.medico_nombre);
    toast.success(`✅ ${spot.medico_nombre} salió`);
    setShowModal(false);
    loadParking();
    loadActiveVehicles();
  }

  async function iniciarMover(spot) {
    setVehiculoAMover({
      id: spot.vehiculo_id,
      nombre: spot.medico_nombre,
      matricula: spot.medico_matricula
    });
    setModoMover(true);
    setShowModal(false);
    toast.success(`🔁 Selecciona nuevo lugar para ${spot.medico_nombre}`);
  }

  async function moverALugar(nuevoSpot) {
    if (!vehiculoAMover) return;
    if (nuevoSpot.activo === true) {
      toast.error(`❌ Lugar ${nuevoSpot.lugar} ya ocupado`);
      return;
    }
    
    const ahora = new Date();
    const horaAsignacion = ahora.toLocaleTimeString('es-AR');
    const fechaAsignacion = ahora.toISOString().split('T')[0];
    
    await supabase.from("parking_assignments").update({ activo: false }).eq("vehiculo_id", vehiculoAMover.id);
    
    const { error } = await supabase
      .from("parking_assignments")
      .update({
        activo: true,
        medico_nombre: vehiculoAMover.nombre,
        medico_matricula: vehiculoAMover.matricula,
        vehiculo_id: vehiculoAMover.id,
        fecha_asignacion: fechaAsignacion,
        hora_asignacion: horaAsignacion
      })
      .eq("id", nuevoSpot.id);
    
    if (!error) {
      toast.success(`🚗 ${vehiculoAMover.nombre} movido a ${nuevoSpot.lugar}`);
      setModoMover(false);
      setVehiculoAMover(null);
      loadParking();
    }
  }

  function cancelarMover() {
    setModoMover(false);
    setVehiculoAMover(null);
    toast.success("Movimiento cancelado");
  }

  function scrollToCol(colId) { document.getElementById(colId)?.scrollIntoView({ behavior: "smooth" }); }
  function scrollToBottom() { window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight }); }

  const filteredVehicles = activeVehicles.filter(v =>
    v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="parkingVirtualSection" className="page-section">
      {/* Header */}
      <div className="parking-header-premium">
        <div className="parking-title-premium">
          <div className="logo-universal" style={{ margin: 0 }}>
            <img src="/logo.png" alt="Logo" style={{ height: "45px" }} />
          </div>
          <div><h2>Parking Virtual</h2><p>Distribución en tiempo real</p></div>
        </div>
        <div className="stats-modernas">
          <div className="stat-card"><span className="stat-icon">🟢</span><div><div className="stat-value" id="libresCount">0</div><div className="stat-label">Libres</div></div></div>
          <div className="stat-card"><span className="stat-icon">🔴</span><div><div className="stat-value" id="ocupadosCount">0</div><div className="stat-label">Ocupados</div></div></div>
          <div className="stat-card"><span className="stat-icon">📊</span><div><div className="stat-value" id="porcentajeCount">0%</div><div className="stat-label">Ocupación</div></div></div>
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
        <button className={`filtro-btn ${activeFilter === 'todos' ? 'active' : ''}`} onClick={() => setActiveFilter('todos')}>🎯 Todos</button>
        <button className={`filtro-btn ${activeFilter === 'medicos' ? 'active' : ''}`} onClick={() => setActiveFilter('medicos')}>👨‍⚕️ Médicos</button>
        <button className={`filtro-btn ${activeFilter === 'junta' ? 'active' : ''}`} onClick={() => setActiveFilter('junta')}>🏛️ Junta</button>
        <button className={`filtro-btn ${activeFilter === 'libres' ? 'active' : ''}`} onClick={() => setActiveFilter('libres')}>🟢 Libres</button>
        <button className={`filtro-btn ${activeFilter === 'ocupados' ? 'active' : ''}`} onClick={() => setActiveFilter('ocupados')}>🔴 Ocupados</button>
      </div>

      {/* Modo mover */}
      {modoMover && (
        <div className="bg-amber-500/20 border border-amber-500 rounded-xl p-3 mb-4 flex justify-between">
          <span>Moviendo a <strong>{vehiculoAMover?.nombre}</strong> - Haz clic en un lugar libre</span>
          <button onClick={cancelarMover} className="text-red-400">Cancelar</button>
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
        <div className="legend-item"><span className="legend-box junta-box"></span> Junta</div>
        <div className="legend-item">🖱️ Click</div>
      </div>

      {/* MODAL */}
      {showModal && selectedSpot && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-amber-500/30">
            <div className={`rounded-t-2xl p-5 ${selectedSpot.activo ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    {selectedSpot.activo ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6" strokeWidth="2"/></svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" strokeWidth="2"/></svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{selectedSpot.activo ? 'Estacionamiento ocupado' : 'Asignar lugar'}</h3>
                    <p className="text-white/70 text-sm">Lugar {selectedSpot.lugar}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-5">
              {selectedSpot.activo ? (
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <p className="text-amber-400 font-semibold">{selectedSpot.medico_nombre}</p>
                    <p className="text-slate-400 text-sm">{selectedSpot.medico_matricula}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => liberarLugar(selectedSpot)} className="flex-1 bg-slate-600 py-2 rounded-xl">Liberar</button>
                    <button onClick={() => darSalida(selectedSpot)} className="flex-1 bg-red-600 py-2 rounded-xl">Salida</button>
                  </div>
                  <button onClick={() => iniciarMover(selectedSpot)} className="w-full bg-amber-600 py-2 rounded-xl">Mover</button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between mb-3">
                    <p>Seleccionar vehículo:</p>
                    <button onClick={() => toggleHabilitarLugar(selectedSpot)} className="text-sm px-2 py-1 rounded bg-red-600/20 text-red-400">
                      {selectedSpot.habilitado === false ? 'Habilitar' : 'Deshabilitar'}
                    </button>
                  </div>
                  {selectedSpot.habilitado === false ? (
                    <p className="text-slate-400 text-center py-4">🚫 Lugar deshabilitado</p>
                  ) : (
                    <>
                      <div className="relative mb-3">
                        <Search className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-700 rounded-lg py-1.5 pl-8 pr-2 text-white text-sm" />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredVehicles.length === 0 ? (
                          <p className="text-slate-400 text-center py-4">No hay vehículos dentro</p>
                        ) : (
                          filteredVehicles.map((v) => (
                            <div key={v.id} onClick={() => asignarLugar(v)} className="bg-slate-700 p-2 rounded-lg cursor-pointer hover:bg-amber-500/20">
                              <p className="text-white font-medium">{v.nombre}</p>
                              <p className="text-slate-400 text-sm">{v.matricula}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}