// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const userData = localStorage.getItem("user");
    let user = null;
      let isAdmin = false;

        if (userData) {
            try {
                  user = JSON.parse(userData);
                        isAdmin = user?.rol === "Admin";
                            } catch (e) {}
                              }

                                if (!user) {
                                    return <Navigate to="/login" replace />;
                                      }

                                        if (adminOnly && !isAdmin) {
                                            return (
                                                  <div className="flex items-center justify-center h-screen text-white">
                                                          <div className="text-center">
                                                                    <h1 className="text-2xl font-bold text-red-400 mb-2">Acceso denegado</h1>
                                                                              <p className="text-slate-400">No tienes permisos para ver esta página.</p>
                                                                                      </div>
                                                                                            </div>
                                                                                                );
                                                                                                  }

                                                                                                    return children;
                                                                                                    }