import React, { useState, useMemo } from 'react';
import { Camera, Zap, Power, PowerOff, AlertTriangle, Clock, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { formatDateTime } from '@/utils/format';

export const Devices: React.FC = () => {
  const devices = useParkingStore((state) => state.devices);
  const tickets = useParkingStore((state) => state.tickets);
  const updateDevice = useParkingStore((state) => state.updateDevice);
  const createTicketFromDevice = useParkingStore((state) => state.createTicketFromDevice);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const gates = devices.filter((d) => d.type === 'gate');
  const cameras = devices.filter((d) => d.type === 'camera');

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const faultCount = devices.filter((d) => d.status === 'fault').length;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggleGate = (gateId: string, currentStatus: string) => {
    updateDevice(gateId, {
      status: currentStatus === 'online' ? 'offline' : 'online',
      lastHeartbeat: new Date().toISOString(),
    });
  };

  const handleCreateTicket = (deviceId: string) => {
    const ticket = createTicketFromDevice(deviceId);
    if (ticket) {
      showMessage('success', `工单 ${ticket.id} 已创建`);
    } else {
      showMessage('error', '创建工单失败');
    }
  };

  const getRelatedTicket = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device?.ticketId) return null;
    return tickets.find((t) => t.id === device.ticketId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">设备状态</h1>
        <p className="mt-1 text-sm text-slate-400">监控和管理停车场设备</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
            message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

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
            {gates.map((gate) => {
              const relatedTicket = getRelatedTicket(gate.id);
              return (
                <div
                  key={gate.id}
                  className="rounded-lg border border-slate-700 p-4 transition-colors hover:bg-slate-700/30"
                >
                  <div className="flex items-center justify-between">
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
                    </div>
                  </div>
                  {(gate.status === 'fault' || gate.status === 'offline') && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-3">
                      {relatedTicket ? (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-slate-400">关联工单:</span>
                          <span className="text-xs text-purple-400">{relatedTicket.id}</span>
                          <StatusBadge status={relatedTicket.status} size="sm" />
                        </div>
                      ) : (
                        <span className="text-xs text-yellow-400">请维修人员处理</span>
                      )}
                      {!relatedTicket && (
                        <button
                          onClick={() => handleCreateTicket(gate.id)}
                          className="flex items-center gap-1 rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-400 hover:bg-purple-500/30"
                        >
                          <MessageSquare className="h-3 w-3" />
                          创建工单
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">摄像设备</h3>
            <span className="text-xs text-slate-400">共 {cameras.length} 台</span>
          </div>
          <div className="mt-4 space-y-3">
            {cameras.map((camera) => {
              const relatedTicket = getRelatedTicket(camera.id);
              return (
                <div
                  key={camera.id}
                  className="rounded-lg border border-slate-700 p-4 transition-colors hover:bg-slate-700/30"
                >
                  <div className="flex items-center justify-between">
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
                    </div>
                  </div>
                  {(camera.status === 'offline' || camera.status === 'fault') && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-700/50 pt-3">
                      {relatedTicket ? (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-slate-400">关联工单:</span>
                          <span className="text-xs text-purple-400">{relatedTicket.id}</span>
                          <StatusBadge status={relatedTicket.status} size="sm" />
                        </div>
                      ) : (
                        <p className="text-xs text-red-400">
                          {camera.status === 'offline' ? '已离线，请注意检查' : '设备故障，请处理'}
                        </p>
                      )}
                      {!relatedTicket && (
                        <button
                          onClick={() => handleCreateTicket(camera.id)}
                          className="flex items-center gap-1 rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-400 hover:bg-purple-500/30"
                        >
                          <MessageSquare className="h-3 w-3" />
                          创建工单
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
