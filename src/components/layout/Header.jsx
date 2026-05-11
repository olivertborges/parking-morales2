export default function Header() {
  return (
    <header className="h-20 border-b border-slate-800 bg-slate-900 px-8 flex items-center justify-between">
      <h2 className="text-white text-2xl font-bold">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-white font-semibold">
            Administrador
          </p>

          <p className="text-slate-400 text-sm">
            Sistema Parking
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold">
          A
        </div>
      </div>
    </header>
  )
}