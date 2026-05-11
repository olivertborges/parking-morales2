// src/pages/users/UsersPage.jsx
import { useEffect, useState } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  User,
  X,
  Save,
  Mail,
  Lock
} from "lucide-react";
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from "../../services/usersService";
import toast from "react-hot-toast";
import { addLog } from "../../services/logsService";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    rol: "Usuario",
    password: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  async function loadUsers() {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setFilteredUsers(data);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({
      nombre: "",
      email: "",
      rol: "Usuario",
      password: ""
    });
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre || "",
      email: user.email || "",
      rol: user.rol || "Usuario",
      password: "" // No mostrar la contraseña existente
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, formData);
    } else {
      if (!formData.password) {
        alert("La contraseña es obligatoria");
        setSaving(false);
        return;
      }
      result = await createUser(formData);
    }

    if (result.success) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    await addLog(user.nombre || "Anónimo", editingUser ? "EDITAR_USUARIO" : "CREAR_USUARIO", `${formData.nombre} - ${formData.email}`);
    toast.success(editingUser ? "✅ Usuario actualizado" : "✅ Usuario creado");
    setShowModal(false);
    loadUsers();
  } else {
    toast.error(`❌ Error: ${result.error}`);
  }

    setSaving(false);
  }

  async function handleDelete(user) {
    if (confirm(`¿Eliminar al usuario "${user.nombre}"?`)) {
      const result = await deleteUser(user.id);
      if (result.success) {
        loadUsers();
      } else {
        alert("Error al eliminar: " + result.error);
      }
    }
  }

  const getRolBadge = (rol) => {
    if (rol === "Admin") {
      return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    }
    return "bg-slate-700 text-slate-300";
  };

  const getRolIcon = (rol) => {
    if (rol === "Admin") {
      return <Shield className="w-3 h-3" />;
    }
    return <User className="w-3 h-3" />;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-sm mt-1">Administración de usuarios del sistema</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 transition hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Agregar usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
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
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Email</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Rol</th>
                <th className="text-left p-4 text-slate-300 font-semibold text-sm">Fecha registro</th>
                <th className="text-center p-4 text-slate-300 font-semibold text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-slate-400">
                    {searchTerm ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="p-4 text-white font-medium">{user.nombre}</td>
                    <td className="p-4 text-slate-300 text-sm">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getRolBadge(user.rol)}`}>
                        {getRolIcon(user.rol)} {user.rol}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
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
            Total: {filteredUsers.length} usuarios
          </p>
        </div>
      </div>

      {/* Modal de Agregar/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                  {editingUser ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingUser ? "Editar usuario" : "Agregar usuario"}
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
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="usuario@hospital.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Usuario">👤 Usuario</option>
                  <option value="Admin">👑 Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Contraseña {editingUser && "(dejar en blanco para mantener)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-2.5 text-white focus:border-amber-500 focus:outline-none"
                  placeholder="••••••"
                  required={!editingUser}
                />
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
                  {saving ? "Guardando..." : (editingUser ? "Actualizar" : "Crear")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}