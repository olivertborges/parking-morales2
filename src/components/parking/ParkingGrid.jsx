import { useState } from 'react'

import ParkingSpot from './ParkingSpot'
import ParkingModal from './ParkingModal'

export default function ParkingGrid() {
  const [selectedSpot, setSelectedSpot] =
    useState(null)

  const [parkingSpots, setParkingSpots] =
    useState([
      {
        id: 1,
        number: 'M1',
        type: 'Médico',
        status: 'free',
        owner: null,
      },

      {
        id: 2,
        number: 'M2',
        type: 'Médico',
        status: 'occupied',
        owner: 'Dr. Pérez',
      },

      {
        id: 3,
        number: 'M3',
        type: 'Médico',
        status: 'reserved',
        owner: 'Reserva',
      },

      {
        id: 4,
        number: 'D1',
        type: 'Directiva',
        status: 'occupied',
        owner: 'Director',
      },

      {
        id: 5,
        number: 'M4',
        type: 'Médico',
        status: 'free',
        owner: null,
      },

      {
        id: 6,
        number: 'M5',
        type: 'Médico',
        status: 'occupied',
        owner: 'Dra. Gómez',
      },
    ])

  const handleChangeStatus = (
    id,
    status
  ) => {
    const updated =
      parkingSpots.map((spot) => {
        if (spot.id === id) {
          return {
            ...spot,
            status,
          }
        }

        return spot
      })

    setParkingSpots(updated)

    setSelectedSpot(null)
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-6">
        {parkingSpots.map((spot) => (
          <div
            key={spot.id}
            onClick={() =>
              setSelectedSpot(spot)
            }
          >
            <ParkingSpot spot={spot} />
          </div>
        ))}
      </div>

      <ParkingModal
        spot={selectedSpot}
        onClose={() =>
          setSelectedSpot(null)
        }
        onChangeStatus={
          handleChangeStatus
        }
      />
    </>
  )
}