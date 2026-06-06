import { create } from 'zustand';
import { ParkingSpot, VehicleRecord, Order, Member, Device, Ticket, ZoneStats, HourlyTraffic, DailyRevenue } from '@/types';
import {
  generateParkingSpots,
  generateVehicleRecords,
  generateOrders,
  generateMembers,
  generateDevices,
  generateTickets,
  generateZoneStats,
  generateHourlyTraffic,
  generateDailyRevenue,
} from '@/utils/mock';

interface ParkingState {
  parkingSpots: ParkingSpot[];
  vehicleRecords: VehicleRecord[];
  orders: Order[];
  members: Member[];
  devices: Device[];
  tickets: Ticket[];
  zoneStats: ZoneStats[];
  hourlyTraffic: HourlyTraffic[];
  dailyRevenue: DailyRevenue[];
  currentUser: string;
  initData: () => void;
  updateParkingSpot: (id: string, status: ParkingSpot['status']) => void;
  addVehicleRecord: (record: VehicleRecord) => void;
  updateVehicleRecord: (id: string, updates: Partial<VehicleRecord>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicketHistory: (ticketId: string, history: Ticket['history'][0]) => void;
}

export const useParkingStore = create<ParkingState>((set) => ({
  parkingSpots: [],
  vehicleRecords: [],
  orders: [],
  members: [],
  devices: [],
  tickets: [],
  zoneStats: [],
  hourlyTraffic: [],
  dailyRevenue: [],
  currentUser: '张经理',

  initData: () => {
    set({
      parkingSpots: generateParkingSpots(),
      vehicleRecords: generateVehicleRecords(),
      orders: generateOrders(),
      members: generateMembers(),
      devices: generateDevices(),
      tickets: generateTickets(),
      zoneStats: generateZoneStats(),
      hourlyTraffic: generateHourlyTraffic(),
      dailyRevenue: generateDailyRevenue(),
    });
  },

  updateParkingSpot: (id, status) =>
    set((state) => ({
      parkingSpots: state.parkingSpots.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    })),

  addVehicleRecord: (record) =>
    set((state) => ({
      vehicleRecords: [record, ...state.vehicleRecords],
    })),

  updateVehicleRecord: (id, updates) =>
    set((state) => ({
      vehicleRecords: state.vehicleRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  addMember: (member) =>
    set((state) => ({
      members: [member, ...state.members],
    })),

  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  updateDevice: (id, updates) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  addTicket: (ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    })),

  updateTicket: (id, updates) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    })),

  addTicketHistory: (ticketId, history) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, history: [...t.history, history], updatedAt: new Date().toISOString() }
          : t
      ),
    })),
}));
