// src/components/ErrorBoundary.jsx
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI alternativa
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Algo salió mal
            </h1>
            <details className="text-slate-300 text-sm">
              <summary className="cursor-pointer font-semibold mb-2">
                Ver detalles del error
              </summary>
              <pre className="mt-2 p-3 bg-slate-900 rounded-lg overflow-auto text-xs">
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 rounded-xl text-white font-semibold"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;