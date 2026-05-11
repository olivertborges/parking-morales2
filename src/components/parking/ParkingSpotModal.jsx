// src/components/parking/ParkingSpotModal.jsx
import { useEffect, useState } from "react";
import { X, Search, User, Car, Clock } from "lucide-react";
import { getVehiclesWithoutSpot, getDoctorsList } from "../../services/vehicleService";
import { assignParkingSpot } from "../../services/parkingAssignmentService";

export default function ParkingSpotModal({ open, spot, onClose }) {
  const [vehicles, setVehicles] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("vehicle"); // vehicle o doctor

  useEffect(() => {
    if (open && spot) {
      loadData();
    }
  }, [open, spot]);

  async function loadData() {
    setLoading(true);
    const vehiclesData = await getVehiclesWithoutSpot();
    const doctorsData = await getDoctorsList();
    setVehicles(vehiclesData);
    setDoctors(doctorsData);
    setLoading(false);
  }

  if (!open || !spot) return null;

  const filteredVehicles = vehicles.filter(v =>
    v.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(d =>
    d.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleAssign() {
    if (!selectedVehicle) {
      alert("Selecciona un vehículo o médico");
      return;
    }

    setLoading(true);
    const result = await assignParkingSpot(
      spot.id,
      selectedVehicle.id,
      selectedVehicle.nombre,
      selectedVehicle.matricula
    );

    if (result.success) {
      alert("Lugar asignado correctamente");
      onClose();
      window.location.reload();
    } else {
      alert("Error al asignar: " + result.error);
    }
    setLoading(false);
  }

  const isOccupied = spot.activo;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800">
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOccupied ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              {isOccupied ? <Car className="w-5 h-5 text-red-500" /> : <Car className="w-5 h-5 text-green-500" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Lugar {spot.lugar}</h2>
              <p className="text-xs text-slate-400">
                {isOccupied ? "Ocupado por:" : "Lugar disponible"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {isOccupied ? (
            // Mostrar información del ocupante actual
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-amber-500" />
                  <span className="text-white font-semibold">{spot.medico_nombre}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-amber-500" />
                  <span className="text-slate-300">{spot.medico_matricula}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (confirm("¿Dar salida a este vehículo?")) {
                    const { freeParkingSpot } = await import("../../services/parkingAssignmentService");
                    const result = await freeParkingSpot(spot.id);
                    if (result.success) {
                      alert("Lugar liberado");
                      onClose();
                      window.location.reload();
                    }
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 py-3 rounded-xl font-semibold text-white"
              >
                Dar salida
              </button>
            </div>
          ) : (
            // Asignar nuevo ocupante
            <div className="space-y-4">
              {/* Selector de tipo */}
              <div className="flex gap-2">
                <button
                  onClick={() => setType("vehicle")}
                  className={`flex-1 py-2 rounded-xl font-medium transition ${
                    type === "vehicle" 
                      ? "bg-amber-500 text-white" 
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Vehículos dentro
                </button>
                <button
                  onClick={() => setType("doctor")}
                  className={`flex-1 py-2 rounded-xl font-medium transition ${
                    type === "doctor" 
                      ? "bg-amber-500 text-white" 
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  Médicos registrados
                </button>
              </div>

              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Buscar ${type === "vehicle" ? "vehículo..." : "médico..."}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* Lista de resultados */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Cargando...</div>
                ) : type === "vehicle" && filteredVehicles.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No hay vehículos sin lugar asignado
                  </div>
                ) : type === "doctor" && filteredDoctors.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No hay médicos registrados
                  </div>
                ) : type === "vehicle" ? (
                  filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`p-3 rounded-xl cursor-pointer transition ${
                        selectedVehicle?.id === vehicle.id
                          ? "bg-amber-500/20 border border-amber-500"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">{vehicle.nombre}</p>
                          <p className="text-xs text-slate-400">{vehicle.matricula}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {vehicle.hora_entrada}
                        </div>
                      </div>
                      {vehicle.sin_tarjeta && (
                        <p className="text-xs text-red-400 mt-1">⚠️ Sin tarjeta</p>
                      )}
                    </div>
                  ))
                ) : (
                  filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => setSelectedVehicle(doctor)}
                      className={`p-3 rounded-xl cursor-pointer transition ${
                        selectedVehicle?.id === doctor.id
                          ? "bg-amber-500/20 border border-amber-500"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                    >
                      <p className="font-semibold text-white">{doctor.nombre}</p>
                      <p className="text-xs text-slate-400">{doctor.matricula}</p>
                      {doctor.modelo && (
                        <p className="text-xs text-slate-500 mt-1">
                          {doctor.modelo} {doctor.color && `- ${doctor.color}`}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Botón asignar */}
              <button
                onClick={handleAssign}
                disabled={!selectedVehicle || loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Asignando..." : "Asignar lugar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}