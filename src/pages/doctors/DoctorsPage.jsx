// src/pages/doctors/DoctorsPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  UserPlus,
  X,
  Save,
  Phone,
  Mail,
  Car,
  Palette,
  Stethoscope,
  QrCode
} from "lucide-react";
import { 
  getDoctors, 
  createDoctor, 
  updateDoctor, 
  deleteDoctor,
  searchDoctors
} from "../../services/doctorsService";
import * as XLSX from "xlsx";

import QRModal from "../../components/qrmodal/QRModal";
import { addLog } from "../../services/logsService";
import { useAuth } from "../../hooks/useAuth";

export default function DoctorsPage() {
  const { isAdmin } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    matricula: "",
    modelo: "",
    color: "",
    especialidad: "",
    telefono: "",
    email: ""
  });
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(null);


  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = doctors.filter(doctor =>
        doctor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  }, [searchTerm, doctors]);

  async function loadDoctors() {
    setLoading(true);
    const data = await getDoctors();
    setDoctors(data);
    setFilteredDoctors(data);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingDoctor(null);
    setFormData({
      nombre: "",
      matricula: "",
      modelo: "",
      color: "",
      especialidad: "",
      telefono: "",
      email: ""
    });
    setShowModal(true);
  }

  function openEditModal(doctor) {
    setEditingDoctor(doctor);
    setFormData({
      nombre: doctor.nombre || "",
      matricula: doctor.matricula || "",
      modelo: doctor.modelo || "",
      color: doctor.color || "",
      especialidad: doctor.especialidad || "",
      telefono: doctor.telefono || "",
      email: doctor.email || ""
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    let result;
    if (editingDoctor) {
      result = await updateDoctor(editingDoctor.id, formData);
    } else {
      result = await createDoctor(formData);
    }

    if (result.success) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    await addLog(user.nombre || "Anónimo", editingDoctor ? "EDITAR_MEDICO" : "CREAR_MEDICO", `${formData.nombre} - ${formData.matricula}`);
    toast.success(editingDoctor ? "✅ Médico actualizado" : "✅ Médico creado");
    setShowModal(false);
    loadDoctors();
  } else {
    toast.error(`❌ Error: ${result.error}`);
  }

    setSaving(false);
  }

  async function handleDelete(doctor) {
    if (confirm(`¿Eliminar a ${doctor.nombre}?`)) {
      const result = await deleteDoctor(doctor.id);
      if (result.success) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await addLog(user.nombre || "Anónimo", "ELIMINAR_MEDICO", `${doctor.nombre} - ${doctor.matricula}`);
      toast.success("✅ Médico eliminado");
      loadDoctors();
    } else {
      toast.error(`❌ Error: ${result.error}`);
    }
    }
  }

  function exportToExcel() {
    const exportData = filteredDoctors.map(doctor => ({
      "Nombre": doctor.nombre,
      "Matrícula": doctor.matricula,
      "Modelo": doctor.modelo || "-",
      "Color": doctor.color || "-",
      "Especialidad": doctor.especialidad || "-",
      "Teléfono": doctor.telefono || "-",
      "Email": doctor.email || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Médicos");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medicos_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Listado de Médicos</h1>
          <p className="text-slate-400 text-sm mt-1">Registro completo de médicos del Hospital</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 transition hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Agregar médico
          </button>
          <button
            onClick={exportToExcel}
            disabled={filteredDoctors.length === 0}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-amber-500 focus:outline-none transition"
        />
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Nombre</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Matrícula</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Modelo</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Color</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Especialidad</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Teléfono</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Email</th>
                <th className="text-center p-4 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-400">
                    {searchTerm ? "No se encontraron médicos" : "No hay médicos registrados"}
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="p-4 text-white font-medium">{doctor.nombre}</td>
                    <td className="p-4 text-slate-300 font-mono text-sm">{doctor.matricula}</td>
                    <td className="p-4 text-slate-400 text-sm">{doctor.modelo || "—"}</td>
                    <td className="p-4">
                      {doctor.color ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: doctor.color.toLowerCase() }}></div>
                          <span className="text-slate-400 text-sm">{doctor.color}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{doctor.especialidad || "—"}</td>
                    <td className="p-4 text-slate-400 text-sm">{doctor.telefono || "—"}</td>
                    <td className="p-4 text-slate-400 text-sm">{doctor.email || "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                        
                        <button
                          onClick={() => setShowQR(doctor)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition"
                          title="Generar QR"
                        >
                          <QrCode className="w-4 h-4 text-amber-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-800/30">
          <p className="text-xs text-slate-400">
            Total: {filteredDoctors.length} médicos
          </p>
        </div>
      </div>

      {/* Modal de Agregar/Editar Médico */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                  {editingDoctor ? <Edit2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingDoctor ? "Editar médico" : "Agregar médico"}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 transition text-white">
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Ej: Dr. Fernando Ruiz"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1">Matrícula</label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white uppercase focus:border-amber-500 focus:outline-none"
                  placeholder="ABC 1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                    <Car className="w-3 h-3" /> Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                    placeholder="Ej: Toyota Corolla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                    placeholder="Ej: Rojo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> Especialidad
                </label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="Ej: Cardiología"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                    placeholder="Ej: 099 123 456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-600 rounded-xl text-white font-medium hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50 transition hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : (editingDoctor ? "Actualizar" : "Crear")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    {showQR && (
      <QRModal medico={showQR} onClose={() => setShowQR(null)} />
    )}
    </div>
  );
}