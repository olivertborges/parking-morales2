// src/pages/Backup.jsx
import BackupButton from '../components/BackupButton';

export default function Backup() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Backup de Datos</h1>
        <p className="text-slate-400">
          Genera una copia de seguridad completa de la base de datos.
          El archivo se descargará en formato JSON.
        </p>
      </div>
      
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <BackupButton />
          <p className="text-xs text-slate-500 mt-4">
            ⚠️ El backup incluye: vehículos, historial, médicos, usuarios y reservas
          </p>
        </div>
      </div>
    </div>
  );
}