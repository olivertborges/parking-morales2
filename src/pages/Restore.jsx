// src/pages/Restore.jsx
import RestoreButton from '../components/RestoreButton';

export default function Restore() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Restaurar Datos</h1>
        <p className="text-slate-400">
          Restaura una copia de seguridad desde un archivo JSON.
          <span className="text-red-400 block mt-1">
            ⚠️ ADVERTENCIA: Esto sobrescribirá todos los datos actuales.
          </span>
        </p>
      </div>
      
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <RestoreButton />
          <p className="text-xs text-slate-500 mt-4">
            💡 Selecciona un archivo .json generado previamente con la función de Backup
          </p>
        </div>
      </div>
    </div>
  );
}