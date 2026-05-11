import MainLayout from '../../layouts/MainLayout'
import ParkingGrid from '../../components/parking/ParkingGrid'

export default function ParkingPage() {
  return (
    <MainLayout>
      <div>
        <h1 className="text-4xl font-bold text-white mb-8">
          Parking Virtual
        </h1>

        <ParkingGrid />
      </div>
    </MainLayout>
  )
}