export interface ParkingSpot {
  id: string;
  spotNumber: string;
  zone: string;
  floor: string;
  status: 'available' | 'occupied' | 'reserved' | 'disabled';
  vehiclePlate?: string;
}

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  entryTime: string;
  exitTime?: string;
  status: 'parking' | 'exited';
  entryImage?: string;
  exitImage?: string;
  isUnlicensed: boolean;
  correctedPlate?: string;
  tempPlate?: string;
  orderId?: string;
  zone?: string;
  floor?: string;
}

export interface InvoiceInfo {
  title: string;
  taxNumber?: string;
  email: string;
  requestedAt: string;
}

export interface Order {
  id: string;
  plateNumber: string;
  entryTime: string;
  exitTime: string;
  duration: number;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'refunded' | 'abnormal';
  couponCode?: string;
  couponApplied: boolean;
  invoiceRequested: boolean;
  invoiceInfo?: InvoiceInfo;
  remark?: string;
  abnormalRemark?: string;
  freeMinutes: number;
  hourlyRate: number;
  maxDailyRate: number;
  createdAt: string;
  paidAt?: string;
  vehicleRecordId?: string;
  zone?: string;
  floor?: string;
  ticketId?: string;
}

export interface Coupon {
  code: string;
  value: number;
  type: 'fixed' | 'percent';
  valid: boolean;
  minAmount?: number;
  description: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  plateNumber: string;
  cardType: 'monthly' | 'quarterly' | 'yearly';
  expireDate: string;
  status: 'active' | 'expired' | 'blacklisted';
}

export interface Device {
  id: string;
  name: string;
  type: 'gate' | 'camera';
  location: string;
  status: 'online' | 'offline' | 'fault';
  lastHeartbeat: string;
  ticketId?: string;
  zone?: string;
  floor?: string;
}

export interface TicketHistory {
  id: string;
  action: string;
  operator: string;
  remark: string;
  timestamp: string;
}

export interface RelatedObject {
  type: 'vehicle' | 'order' | 'member' | 'device';
  id: string;
  displayName: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'complaint' | 'consult' | 'fault' | 'other';
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  history: TicketHistory[];
  relatedObject?: RelatedObject;
}

export interface ZoneStats {
  name: string;
  total: number;
  available: number;
  occupied: number;
}

export interface HourlyTraffic {
  hour: string;
  entry: number;
  exit: number;
  zone?: string;
  date?: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
  zone?: string;
  entryTraffic?: number;
  exitTraffic?: number;
}

export interface BillingCalculation {
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  freeMinutes: number;
  billableMinutes: number;
  hourlyRate: number;
  maxDailyRate: number;
  baseAmount: number;
  cappedAmount: number;
  totalAmount: number;
}
