/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  key: string;
  labelAr: string;
  labelEn: string;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number; // Sale price
  cost: number;  // Wholesale cost
  quantity: number; // Stock quantity
  minQuantity: number; // Out of stock warning threshold
  category: string;
  barcode: string; // Barcode scan value
  image?: string; // Loaded image base64 or placeholder
  isAvailable: boolean;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'card' | 'deferred' | 'wallet';
  date: string; // ISO String
  cashierName: string;
  qrCodeUrl?: string; // Electronic invoice QR representation
  offline?: boolean; // Offline flag
  customerName?: string;
  customerPhone?: string;
}

export interface Employee {
  id: string;
  nameAr: string;
  nameEn: string;
  role: 'admin' | 'cashier' | 'manager';
  pinCode: string; // For rapid switches / 2FA checking
  email?: string;
  active: boolean;
}

export interface CafeSettings {
  logoUrl?: string; // Custom uploaded base64 logo
  nameAr: string;
  nameEn: string;
  taxRate: number; // percentage (e.g. 15 for 15%)
  currencyAr: string; // e.g. "ر.س"
  currencyEn: string; // e.g. "SAR"
  receiptHeaderAr: string;
  receiptHeaderEn: string;
  receiptFooterAr: string;
  receiptFooterEn: string;
  primaryColor: string; // Hex color for user branding customizer
  accentColor: string;
  enableVat: boolean;
  enable2FA: boolean;
  twoFactorPin: string; // PIN override
  receiptFontSize?: number; // Receipt custom base font size
  showReceiptLogo?: boolean;
  showReceiptTax?: boolean;
  showReceiptQr?: boolean;
  showReceiptHeader?: boolean;
  showReceiptFooter?: boolean;
  showReceiptCustomer?: boolean;
  showReceiptEmployee?: boolean;
  receiptBlockOrder?: string[]; // list of block IDs like ['logo', 'header', 'info', 'items', 'totals', 'qr', 'footer']
  printerPaperSize?: "80mm" | "58mm"; // Xprint thermal printer roll size preset
  printerModel?: "Xprint" | "Standard"; // Thermal printer brand tuning
  printerDensity?: "dense" | "medium" | "spacious"; // Spacing/line padding density
  printerConfigs?: PrinterConfig[]; // Multiple printer routing configurations
}

export interface PrinterConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  connectionType: 'usb' | 'network' | 'bluetooth' | 'browser';
  connectionValue: string;
  paperSize: '80mm' | '58mm';
  categories: string[]; // e.g., ["food", "drinks-hot"] or ["retail"]
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string; // ISO
}

export interface ForecastResult {
  nextWeekEstimate: number;
  bestSellingCategory: string;
  trendAnalysisAr: string;
  trendAnalysisEn: string;
  demandedItems: string[];
}

export interface TableOrder {
  tableId: string;
  tableNameAr: string;
  tableNameEn: string;
  items: OrderItem[];
  status: 'idle' | 'occupied';
  updatedAt?: string;
  occupiedSince?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  lastVisit: string;
}
