export default function ParkingSpot({
  spot,
}) {
  const getColor = () => {
    if (spot.status === 'occupied')
      return 'bg-red-500'

    if (spot.status === 'reserved')
      return 'bg-yellow-500'

    return 'bg-green-500'
  }

  return (
    <div
      className={`${getColor()} rounded-2xl p-4 h-28 flex flex-col justify-between cursor-pointer hover:scale-105 transition`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-lg">
          {spot.number}
        </h3>

        <span className="text-xs bg-black/20 px-2 py-1 rounded text-white">
          {spot.type}
        </span>
      </div>

      <div>
        <p className="text-white text-sm">
          {spot.owner || 'Libre'}
        </p>

        <p className="text-white/70 text-xs mt-1">
          {spot.status}
        </p>
      </div>
    </div>
  )
}