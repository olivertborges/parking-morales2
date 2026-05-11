export default function ParkingModal({
  spot,
  onClose,
  onChangeStatus,
}) {
  if (!spot) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 w-[450px] rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            Plaza {spot.number}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-slate-400">
              Tipo
            </p>

            <p className="text-white text-lg">
              {spot.type}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Estado
            </p>

            <p className="text-white text-lg capitalize">
              {spot.status}
            </p>
          </div>

          <div>
            <p className="text-slate-400">
              Responsable
            </p>

            <p className="text-white text-lg">
              {spot.owner || 'Libre'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <button
            onClick={() =>
              onChangeStatus(
                spot.id,
                'free'
              )
            }
            className="bg-green-500 hover:bg-green-600 transition p-3 rounded-xl font-bold"
          >
            Liberar
          </button>

          <button
            onClick={() =>
              onChangeStatus(
                spot.id,
                'occupied'
              )
            }
            className="bg-red-500 hover:bg-red-600 transition p-3 rounded-xl font-bold"
          >
            Ocupar
          </button>

          <button
            onClick={() =>
              onChangeStatus(
                spot.id,
                'reserved'
              )
            }
            className="bg-yellow-500 hover:bg-yellow-600 transition p-3 rounded-xl font-bold text-black"
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  )
}