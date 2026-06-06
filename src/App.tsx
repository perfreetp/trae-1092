import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ParkingMap } from '@/pages/ParkingMap';
import { Vehicles } from '@/pages/Vehicles';
import { Orders } from '@/pages/Orders';
import { Members } from '@/pages/Members';
import { Devices } from '@/pages/Devices';
import { Tickets } from '@/pages/Tickets';
import { Reports } from '@/pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<ParkingMap />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="orders" element={<Orders />} />
          <Route path="members" element={<Members />} />
          <Route path="devices" element={<Devices />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
