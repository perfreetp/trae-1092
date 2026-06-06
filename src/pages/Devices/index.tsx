import React from 'react';
import { Camera, Zap, Power, PowerOff, AlertTriangle, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { formatDateTime } from '@/utils/format';

export const Devices: React.FC = () => {
  const devices = useParkingStore((state) => state.devices);
  const updateDevice = useParkingStore((state) => state.updateDevice);

  const gates = devices.filter((d) => d.type === 'gate');
  const cameras = devices.filter((d) => d.type === 'camera');

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const faultCount = devices.filter((d) => d.status === 'fault').length;

  const handleToggleGate = (gateId: string, currentStatus: string) => {
    updateDevice(gateId, {
      status: currentStatus === 'online' ? 'offline' : 'online',
      lastHeartbeat: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">设备状态</h1>
        <p className="mt-1 text-sm text-slate-400">监控和管理停车场设备</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">设备总数</p>
              <p className="mt-2 text-2xl font-bold text-white">{devices.length}</p>
            </div>
            <div className="rounded-lg bg-blue-500/20 p-2">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">在线</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{onlineCount}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <Power className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">离线</p>
              <p className="mt-2 text-2xl font-bold text-red-400">{offlineCount}</p>
            </div>
            <div className="rounded-lg bg-red-500/20 p-2">
              <PowerOff className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">故障</p>
              <p className="mt-2 text-2xl font-bold text-yellow-400">{faultCount}</p>
            </div>
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">道闸设备</h3>
            <span className="text-xs text-slate-400">共 {gates.length} 台</span>
          </div>
          <div className="mt-4 space-y-3">
            {gates.map((gate) => (
              <div
                key={gate.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 p-4 transition-colors hover:bg-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${
                    gate.status === 'online' ? 'bg-emerald-500/20' : 
                    gate.status === 'fault' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}>
                    <Zap className={`h-5 w-5 ${
                      gate.status === 'online' ? 'text-emerald-400' :
                      gate.status === 'fault' ? 'text-yellow-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{gate.name}</p>
                    <p className="text-xs text-slate-400">{gate.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={gate.status} />
                  {gate.status !== 'fault' && (
                    <button
                      onClick={() => handleToggleGate(gate.id, gate.status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        gate.status === 'online'
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {gate.status === 'online' ? '远程关闸' : '远程开闸'}
                    </button>
                  )}
                  {gate.status === 'fault' && (
                    <span className="text-xs text-yellow-400">请维修人员处理</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">摄像设备</h3>
            <span className="text-xs text-slate-400">共 {cameras.length} 台</span>
          </div>
          <div className="mt-4 space-y-3">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 p-4 transition-colors hover:bg-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${
                    camera.status === 'online' ? 'bg-emerald-500/20' : 
                    camera.status === 'fault' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}>
                    <Camera className={`h-5 w-5 ${
                      camera.status === 'online' ? 'text-emerald-400' :
                      camera.status === 'fault' ? 'text-yellow-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">{camera.name}</p>
                    <p className="text-xs text-slate-400">{camera.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={camera.status} />
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(camera.lastHeartbeat)}
                  </div>
                  {camera.status === 'offline' && (
                    <p className="mt-1 text-xs text-red-400">已离线，请注意检查</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
