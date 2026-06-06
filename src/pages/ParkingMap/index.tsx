import React, { useState } from 'react';
import { MapPin, Car, CarFront } from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { PARKING_ZONES } from '@/utils/constants';

export const ParkingMap: React.FC = () => {
  const parkingSpots = useParkingStore((state) => state.parkingSpots);
  const [selectedFloor, setSelectedFloor] = useState('B1');
  const [selectedZone, setSelectedZone] = useState('A');

  const floors = ['B1', 'B2'];
  const zones = PARKING_ZONES.filter((z) => z.floor === selectedFloor);

  const filteredSpots = parkingSpots.filter(
    (s) => s.floor === selectedFloor && s.zone === selectedZone
  );

  const zoneStats = zones.map((zone) => {
    const zoneSpots = parkingSpots.filter((s) => s.zone === zone.id && s.floor === selectedFloor);
    return {
      ...zone,
      available: zoneSpots.filter((s) => s.status === 'available').length,
      occupied: zoneSpots.filter((s) => s.status === 'occupied').length,
    };
  });

  const getSpotColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
      case 'occupied':
        return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'reserved':
        return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'disabled':
        return 'bg-gray-500/20 border-gray-500 text-gray-400';
      default:
        return 'bg-slate-500/20 border-slate-500';
    }
  };

  const getSpotIcon = (status: string) => {
    if (status === 'occupied') return <Car className="h-4 w-4" />;
    if (status === 'available') return <MapPin className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">车场地图</h1>
        <p className="mt-1 text-sm text-slate-400">实时查看各区域车位使用情况</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 space-y-4">
          <div className="rounded-xl bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-white">选择楼层</h3>
            <div className="mt-3 space-y-2">
              {floors.map((floor) => (
                <button
                  key={floor}
                  onClick={() => {
                    setSelectedFloor(floor);
                    const firstZone = PARKING_ZONES.find((z) => z.floor === floor);
                    if (firstZone) setSelectedZone(firstZone.id);
                  }}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedFloor === floor
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {floor}层
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-white">选择区域</h3>
            <div className="mt-3 space-y-2">
              {zoneStats.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-all ${
                    selectedZone === zone.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{zone.name}</span>
                    <span className="text-xs opacity-75">
                      {zone.available}/{zone.spots}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                      style={{ width: `${(zone.available / zone.spots) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-white">图例说明</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-4 w-4 rounded bg-emerald-500/20 border border-emerald-500" />
                <span className="text-slate-300">空闲</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-4 w-4 rounded bg-orange-500/20 border border-orange-500" />
                <span className="text-slate-300">已占用</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-4 w-4 rounded bg-blue-500/20 border border-blue-500" />
                <span className="text-slate-300">预留</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-4 w-4 rounded bg-gray-500/20 border border-gray-500" />
                <span className="text-slate-300">禁用</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-xl bg-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              {selectedFloor}层 - {selectedZone}区
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CarFront className="h-4 w-4" />
              <span>
                共 {filteredSpots.length} 个车位，空闲{' '}
                {filteredSpots.filter((s) => s.status === 'available').length} 个
              </span>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-2">
            {filteredSpots.slice(0, 100).map((spot) => (
              <div
                key={spot.id}
                className={`group relative flex aspect-square cursor-pointer items-center justify-center rounded border-2 transition-all hover:scale-105 ${getSpotColor(
                  spot.status
                )}`}
                title={`车位号: ${spot.spotNumber}\n状态: ${spot.status === 'available' ? '空闲' : spot.status === 'occupied' ? '已占用' : spot.status === 'reserved' ? '预留' : '禁用'}${spot.vehiclePlate ? '\n车牌: ' + spot.vehiclePlate : ''}`}
              >
                {getSpotIcon(spot.status)}
                <div className="absolute -bottom-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
                  {spot.spotNumber}
                </div>
              </div>
            ))}
          </div>

          {filteredSpots.length > 100 && (
            <div className="mt-4 text-center text-sm text-slate-400">
              还有 {filteredSpots.length - 100} 个车位未显示，共 {filteredSpots.length} 个车位
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
