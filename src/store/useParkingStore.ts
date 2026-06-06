import { create } from 'zustand';
import {
  ParkingSpot,
  VehicleRecord,
  Order,
  Member,
  Device,
  Ticket,
  ZoneStats,
  HourlyTraffic,
  DailyRevenue,
  Coupon,
  InvoiceInfo,
  RelatedObject,
} from '@/types';
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
  generateCoupons,
  calculateBilling,
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
  coupons: Coupon[];
  currentUser: string;
  initData: () => void;
  updateParkingSpot: (id: string, status: ParkingSpot['status']) => void;
  addVehicleRecord: (record: VehicleRecord) => void;
  updateVehicleRecord: (id: string, updates: Partial<VehicleRecord>) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  applyCoupon: (orderId: string, couponCode: string) => { success: boolean; message: string };
  requestInvoice: (orderId: string, invoiceInfo: InvoiceInfo) => { success: boolean; message: string };
  markOrderAbnormal: (orderId: string, remark: string) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addTicketHistory: (ticketId: string, history: Ticket['history'][0]) => void;
  assignTicket: (ticketId: string, assignee: string) => void;
  updateTicketPriority: (ticketId: string, priority: Ticket['priority']) => void;
  linkRelatedObject: (ticketId: string, relatedObject: RelatedObject) => void;
  calculateParkingFee: (plateNumber: string, entryTime: string) => Order;
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  parkingSpots: [],
  vehicleRecords: [],
  orders: [],
  members: [],
  devices: [],
  tickets: [],
  zoneStats: [],
  hourlyTraffic: [],
  dailyRevenue: [],
  coupons: [],
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
      coupons: generateCoupons(),
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

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  applyCoupon: (orderId, couponCode) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    const coupon = state.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase());

    if (!order) {
      return { success: false, message: '订单不存在' };
    }

    if (order.couponApplied) {
      return { success: false, message: '该订单已使用优惠券，不能重复抵扣' };
    }

    if (!coupon) {
      return { success: false, message: '优惠券不存在' };
    }

    if (!coupon.valid) {
      return { success: false, message: '优惠券已失效或过期' };
    }

    if (coupon.minAmount && order.totalAmount < coupon.minAmount) {
      return { success: false, message: `订单金额需满${coupon.minAmount}元才能使用该优惠券` };
    }

    let discountAmount = 0;
    if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, order.totalAmount);
    } else {
      discountAmount = Math.floor(order.totalAmount * (coupon.value / 100));
    }

    const paidAmount = Math.max(0, order.totalAmount - discountAmount);

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              couponCode: coupon.code,
              couponApplied: true,
              discountAmount,
              paidAmount,
            }
          : o
      ),
    }));

    return { success: true, message: `优惠券核销成功，优惠${discountAmount}元` };
  },

  requestInvoice: (orderId, invoiceInfo) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);

    if (!order) {
      return { success: false, message: '订单不存在' };
    }

    if (order.invoiceRequested) {
      return { success: false, message: '该订单已申请发票' };
    }

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              invoiceRequested: true,
              invoiceInfo: {
                ...invoiceInfo,
                requestedAt: new Date().toISOString(),
              },
            }
          : o
      ),
    }));

    return { success: true, message: '发票申请已提交' };
  },

  markOrderAbnormal: (orderId, remark) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'abnormal',
              abnormalRemark: remark,
              remark,
            }
          : o
      ),
    }));
  },

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

  assignTicket: (ticketId, assignee) => {
    const state = get();
    const currentUser = state.currentUser;

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignee,
              history: [
                ...t.history,
                {
                  id: Math.random().toString(36).substring(2, 10),
                  action: `分配给${assignee}`,
                  operator: currentUser,
                  remark: '',
                  timestamp: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  updateTicketPriority: (ticketId, priority) => {
    const state = get();
    const currentUser = state.currentUser;
    const priorityLabels = { low: '低', medium: '中', high: '高' };

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              priority,
              history: [
                ...t.history,
                {
                  id: Math.random().toString(36).substring(2, 10),
                  action: `调整优先级为${priorityLabels[priority]}`,
                  operator: currentUser,
                  remark: '',
                  timestamp: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  linkRelatedObject: (ticketId, relatedObject) => {
    const state = get();
    const currentUser = state.currentUser;

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              relatedObject,
              history: [
                ...t.history,
                {
                  id: Math.random().toString(36).substring(2, 10),
                  action: `关联${relatedObject.type === 'order' ? '订单' : relatedObject.type === 'vehicle' ? '车辆' : '会员'}`,
                  operator: currentUser,
                  remark: relatedObject.displayName,
                  timestamp: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  },

  calculateParkingFee: (plateNumber, entryTime) => {
    const exitTime = new Date().toISOString();
    const billing = calculateBilling(entryTime, exitTime);

    return {
      id: 'ORD' + Date.now().toString().slice(-6).toUpperCase(),
      plateNumber,
      entryTime,
      exitTime,
      duration: billing.durationMinutes,
      totalAmount: billing.totalAmount,
      discountAmount: 0,
      paidAmount: billing.totalAmount,
      status: 'pending' as const,
      couponApplied: false,
      invoiceRequested: false,
      freeMinutes: billing.freeMinutes,
      hourlyRate: billing.hourlyRate,
      maxDailyRate: billing.maxDailyRate,
      createdAt: exitTime,
      paidAt: undefined,
    };
  },
}));
