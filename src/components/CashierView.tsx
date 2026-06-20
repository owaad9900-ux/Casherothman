/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, CreditCard, Wallet, Coins, Clock, Trash2, ArrowRight, Printer, AlertCircle, Barcode as BarcodeIcon, ShieldCheck, CheckCircle2, QrCode, Utensils, Send, Network, Cpu, Wifi } from "lucide-react";
import { Product, OrderItem, Order, TableOrder, Customer, Category } from "../types";
import { formatCurrency, generateInvoiceQRCode } from "../utils";

interface CashierViewProps {
  lang: 'ar' | 'en';
  inventory: Product[];
  onCreateOrder: (order: Order) => void;
  onUpdateInventoryQuantity: (id: string, delta: number) => void;
  settings: any;
  isOnline: boolean;
  tables?: TableOrder[];
  onClearTableSession?: (tableId: string) => void;
  customers?: Customer[];
  categories: Category[];
}

export default function CashierView({
  lang,
  inventory,
  onCreateOrder,
  onUpdateInventoryQuantity,
  settings,
  isOnline,
  tables = [],
  onClearTableSession,
  customers = [],
  categories = []
}: CashierViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Barcode scan states
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");

  // Checkout modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet' | 'deferred'>('cash');
  const [cashReceived, setCashReceived] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [activeCreatedInvoice, setActiveCreatedInvoice] = useState<Order | null>(null);
  
  // Custom multi-printer dispatch tracker
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>("prn-cashier");
  const [dispatchStatuses, setDispatchStatuses] = useState<{[key: string]: 'routing' | 'sending' | 'printed'}>({});

  // Simulate network transmission of separate print jobs to each active thermal printer
  useEffect(() => {
    if (checkoutSuccess && activeCreatedInvoice) {
      const activePrinters = (settings.printerConfigs || []).filter((p: any) => p.isActive);
      
      const timers: NodeJS.Timeout[] = [];
      activePrinters.forEach((p: any) => {
        // Mock routing start
        setDispatchStatuses(prev => ({ ...prev, [p.id]: 'routing' }));

        // Progress to Sending
        const t1 = setTimeout(() => {
          setDispatchStatuses(prev => ({ ...prev, [p.id]: 'sending' }));
        }, 600 + Math.random() * 500);

        // Progress to Printed (Simulation complete)
        const t2 = setTimeout(() => {
          setDispatchStatuses(prev => ({ ...prev, [p.id]: 'printed' }));
        }, 1600 + Math.random() * 800);

        timers.push(t1, t2);
      });

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [checkoutSuccess, activeCreatedInvoice, settings.printerConfigs]);

  // Table session mapping states
  const [importedTableId, setImportedTableId] = useState<string | null>(null);
  const [showTableSelectModal, setShowTableSelectModal] = useState(false);
  
  // Custom QR scanner order simulation
  const [showQrOrderScanner, setShowQrOrderScanner] = useState(false);
  const [qrSimulationMessage, setQrSimulationMessage] = useState("");

  // Find active printer configuration
  const defaultPrinters = [
    {
      id: "prn-cashier",
      nameAr: "طابعة الكاشير (الفواتير الرئيسية)",
      nameEn: "Main Cashier Printer",
      connectionType: 'browser',
      connectionValue: "Default",
      paperSize: "80mm",
      categories: [],
      isActive: true
    },
    {
      id: "prn-kitchen",
      nameAr: "طابعة المطبخ (الوجبات والأطعمة)",
      nameEn: "Kitchen Food Printer",
      connectionType: 'network',
      connectionValue: "192.168.1.100",
      paperSize: "80mm",
      categories: ["food"],
      isActive: true
    },
    {
      id: "prn-bar",
      nameAr: "طابعة البار (المشروبات الساخنة والباردة)",
      nameEn: "Bar Drinks Printer",
      connectionType: 'network',
      connectionValue: "192.168.1.105",
      paperSize: "58mm",
      categories: ["drinks-hot", "drinks-cold"],
      isActive: true
    }
  ];

  const activePrintersList = settings.printerConfigs && settings.printerConfigs.length > 0 
    ? settings.printerConfigs 
    : defaultPrinters;

  const selectedPrinterObj = activePrintersList.find((p: any) => p.id === selectedPrinterId) || activePrintersList[0];
  const isCashierMaster = selectedPrinterId === "prn-cashier";
  const currentPrinterPaperSize = selectedPrinterObj?.paperSize || "80mm";
  const itemsToDisplay = (activeCreatedInvoice?.items || []).filter(item => 
    isCashierMaster || (selectedPrinterObj.categories && selectedPrinterObj.categories.includes(item.product.category))
  );

  // Auto-manage default category active filter
  useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some(c => c.key === activeCategory);
      if (!exists) {
        setActiveCategory(categories[0].key);
      }
    } else {
      setActiveCategory("");
    }
  }, [categories, activeCategory]);

  // Keyboard wedge physical barcode listener simulator
  useEffect(() => {
    let barcodeBuffer = "";
    let lastKeypressTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      // Rapid keyboard inputs are treated as hardware scans
      if (now - lastKeypressTime > 90) {
        barcodeBuffer = "";
      }
      lastKeypressTime = now;

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 6) {
          triggerBarcodeSearch(barcodeBuffer);
          barcodeBuffer = "";
        }
      } else if (/^[0-9]$/.test(e.key)) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inventory, cart]);

  const triggerBarcodeSearch = (barCodeDigits: string) => {
    const product = inventory.find(p => p.barcode === barCodeDigits);
    if (product) {
      handleProductSelect(product);
      setLastScannedBarcode(barCodeDigits);
      setTimeout(() => setLastScannedBarcode(""), 3500);
    }
  };

  const handleProductSelect = (product: Product) => {
    if (product.quantity <= 0) return;
    
    // Check if item is already in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (idx: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      updated[idx].quantity = newQty;
    }
    setCart(updated);
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const calculateTax = (subtotal: number) => {
    if (settings.enableVat) {
      return subtotal * (settings.taxRate / 100);
    }
    return 0;
  };

  const handleTriggerCheckoutModal = () => {
    if (cart.length === 0) return;
    setCheckoutModalOpen(true);
    setCheckoutSuccess(false);
    setCashReceived("");
  };

  const handleExecuteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    const cashProvided = parseFloat(cashReceived) || total;
    const changeAmount = cashProvided >= total ? cashProvided - total : 0;

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    // Generate ZATCA / Saudi Fatoora compatible QR representation
    const qrUrl = await generateInvoiceQRCode({
      sellerName: lang === 'ar' ? settings.nameAr : settings.nameEn,
      vatNumber: settings.receiptHeaderAr || "300092810000003",
      timestamp: new Date().toISOString(),
      total,
      tax
    });

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      invoiceNumber,
      items: cart,
      subtotal,
      tax,
      total,
      amountPaid: cashProvided,
      changeAmount,
      paymentMethod,
      date: new Date().toISOString(),
      cashierName: "Ahmad Barista",
      qrCodeUrl: qrUrl,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      offline: !isOnline
    };

    // Decrement physical inventory stock checks
    cart.forEach(item => {
      onUpdateInventoryQuantity(item.product.id, -item.quantity);
    });

    onCreateOrder(newOrder);
    setActiveCreatedInvoice(newOrder);
    setCheckoutSuccess(true);
    setSelectedPrinterId("prn-cashier");
    setCart([]); // Clear cart
    if (importedTableId && onClearTableSession) {
      onClearTableSession(importedTableId);
    }
    setImportedTableId(null);
  };

  // Simulate a QR Code scan for smart table orders
  const handleSimulateQrOrderScan = () => {
    setShowQrOrderScanner(true);
    setQrSimulationMessage(lang === 'ar' ? "جاري محاكاة مسح QR للطلب السريع..." : "Simulating QR scanned quick table order...");
    
    setTimeout(() => {
      // Pick 2 random hot drinks and bakery items to load into cart
      const hotDrinks = inventory.filter(p => p.category === "drinks-hot" && p.quantity > 5);
      const food = inventory.filter(p => p.category === "food" && p.quantity > 2);

      if (hotDrinks.length > 0 && food.length > 0) {
        const item1 = hotDrinks[0];
        const item2 = food[0];
        
        setCart([
          { product: item1, quantity: 2 },
          { product: item2, quantity: 1 }
        ]);
        
        setQrSimulationMessage(lang === 'ar' 
          ? `📍 تم العثور على طلب طاولة رقم 4: 2x ${item1.nameAr}، 1x ${item2.nameAr}. تم تحميله في السلة!` 
          : `📍 Scanned Table 4 order: 2x ${item1.nameEn}, 1x ${item2.nameEn}. Loaded into Cashier Cart!`);
      } else {
        setQrSimulationMessage(lang === 'ar' ? "فشل مسح كود QR: المخزون غير كافٍ." : "QR Scan failed: Stocks insufficient.");
      }

      setTimeout(() => setShowQrOrderScanner(false), 4500);
    }, 1800);
  };

  const handleThermalPrint = () => {
    window.print();
  };

  const filteredInventory = inventory.filter(p => {
    const matchesSearch = 
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = p.category === activeCategory;
    return matchesSearch && matchesCategory && p.isAvailable;
  });

  const currencySymbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative">
      
      {/* Keyboard wedge notification flash */}
      {lastScannedBarcode && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 border border-teal-500 text-teal-400 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-xl animate-bounce font-mono text-xs">
          <ShieldCheck className="w-4.5 h-4.5 text-teal-400" />
          <span>[Wedge Hardware Barcode Detected]: {lastScannedBarcode}</span>
        </div>
      )}

      {/* Product Selection area */}
      <div className="xl:col-span-8 flex flex-col space-y-4 font-sans">
        
        {/* Filters and search block */}
        <div className="bg-white dark:bg-[#111827] p-3 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={lang === 'ar' ? "ابحث عن منتج بالاسم..." : "Find hot latte, croissants, matcha..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="relative flex bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2 items-center gap-2">
            <BarcodeIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={lang === 'ar' ? " محاكي الباركود..." : "Test scan simulation..."}
              value={barcodeQuery}
              onChange={(e) => {
                setBarcodeQuery(e.target.value);
                triggerBarcodeSearch(e.target.value);
              }}
              className="w-28 text-xs bg-transparent border-none outline-none font-mono text-gray-800 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleSimulateQrOrderScan}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50/60 dark:bg-emerald-950/15 hover:bg-emerald-100/60 text-emerald-705 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-100/50 dark:border-emerald-950/40 transition shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>{lang === 'ar' ? "مسح كود كيو آب للطلب" : "Scan QR Code Order"}</span>
          </button>
        </div>

        {/* QR Order simulation view */}
        {showQrOrderScanner && (
          <div className="p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in text-xs font-mono text-white" style={{ backgroundColor: settings.primaryColor }}>
            <QrCode className="w-5 h-5 animate-spin" />
            <span>{qrSimulationMessage}</span>
          </div>
        )}

        {/* Categories filters tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const isActive = activeCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                  isActive
                    ? "text-white border-transparent shadow-xs"
                    : "bg-white dark:bg-[#111827] border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-900"
                }`}
                style={isActive ? { backgroundColor: settings.primaryColor } : {}}
              >
                {lang === 'ar' ? c.labelAr : c.labelEn}
              </button>
            );
          })}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredInventory.map((p) => {
            const isOutOfStock = p.quantity <= 0;
            return (
              <button
                key={p.id}
                onClick={() => handleProductSelect(p)}
                disabled={isOutOfStock}
                className={`p-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] rounded-2xl flex flex-col justify-between text-right transition group text-gray-800 dark:text-gray-100 select-none ${
                  isOutOfStock 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:border-emerald-500 active:scale-98 cursor-pointer"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] bg-gray-50 dark:bg-slate-850 text-gray-500 px-2 py-0.5 rounded font-mono font-semibold">
                      {p.quantity > 0 ? `${p.quantity} left` : "SOLD OUT"}
                    </span>
                  </div>
                  <b className="text-[13px] font-bold block truncate max-w-[170px] leading-snug text-gray-900 dark:text-white">
                    {lang === 'ar' ? p.nameAr : p.nameEn}
                  </b>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">{p.barcode}</span>
                </div>
                
                <p className="text-[14px] font-bold font-mono mt-4 leading-none" style={{ color: settings.primaryColor }}>
                  {formatCurrency(p.price, currencySymbol, lang)}
                </p>
              </button>
            );
          })}
        </div>

      </div>

      {/* Active Checkout list area */}
      <div className="xl:col-span-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between h-[75vh] shadow-[0_2px_12px_-5px_rgba(0,0,0,0.04)]">
        
        {/* Cart Title */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-slate-800 gap-1">
          <div className="flex items-center gap-2 max-w-[50%] shrink-0">
            <ShoppingCart className="w-4.5 h-4.5 shrink-0" style={{ color: settings.primaryColor }} />
            <h3 className="font-bold text-xs uppercase tracking-tight text-gray-900 dark:text-white truncate">
              {lang === 'ar' ? "سلة الفاتورة" : "Active Invoice"}
            </h3>
          </div>
          
          <div className="flex items-center gap-1.5 overflow-hidden">
            {tables && tables.some(t => t.items.length > 0) && (
              <button
                onClick={() => setShowTableSelectModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition shadow-xs shrink-0 cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>{lang === 'ar' ? "سحب طلب طاولة" : "Pull Table"}</span>
              </button>
            )}

            <button
              onClick={() => {
                setCart([]);
                setImportedTableId(null);
                setCustomerName("");
              }}
              disabled={cart.length === 0}
              className="p-1 px-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100/60 rounded-lg text-[10px] font-bold uppercase transition disabled:opacity-45 shrink-0"
            >
              {lang === 'ar' ? "تصفير" : "Clear"}
            </button>
          </div>
        </div>

        {importedTableId && (
          <div className="p-2.5 bg-amber-55/70 dark:bg-amber-955/15 border border-amber-200/50 rounded-xl text-[10px] flex items-center justify-between font-sans mt-2 shrink-0">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                {lang === 'ar' 
                  ? `📍 مستوردة من: ${tables.find(t => t.tableId === importedTableId)?.tableNameAr || ""}` 
                  : `📍 Pulling from: ${tables.find(t => t.tableId === importedTableId)?.tableNameEn || ""}`
                }
              </span>
            </div>
            <button
              onClick={() => {
                setImportedTableId(null);
                setCustomerName("");
                setCart([]);
              }}
              className="text-[9px] underline text-gray-400 hover:text-gray-900 cursor-pointer"
            >
              {lang === 'ar' ? "فصل وحذف" : "Disconnect"}
            </button>
          </div>
        )}

        {/* Scroll list items */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {cart.map((item, idx) => (
            <div key={idx} className="p-3 bg-gray-50/50 dark:bg-slate-900/40 rounded-xl flex justify-between items-center bg-transparent border border-gray-100 dark:border-slate-800/70 transition">
              <div className="space-y-1 max-w-[160px] text-right">
                <b className="text-xs font-bold block truncate text-gray-900 dark:text-white">
                  {lang === 'ar' ? item.product.nameAr : item.product.nameEn}
                </b>
                <span className="text-[11px] font-mono text-gray-400 block">
                  {formatCurrency(item.product.price, currencySymbol, lang)}
                </span>
              </div>

              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <button
                  onClick={() => handleUpdateQuantity(idx, -1)}
                  className="px-2 py-1 bg-gray-150 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 rounded font-bold text-xs"
                >
                  -
                </button>
                <span className="font-mono font-bold text-xs">{item.quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(idx, 1)}
                  disabled={item.quantity >= item.product.quantity}
                  className="px-2 py-1 bg-gray-150 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 rounded font-bold text-xs disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-slate-750 mb-2.5" />
              <p className="text-[11px] text-gray-400 font-sans text-center leading-normal">
                {lang === 'ar' ? "السلة فارغة حالياً. اضغط على مشروب أو حلوى لبدء إصدار الفاتورة." : "Cart is currently empty. Tap items to generate receipt."}
              </p>
            </div>
          )}
        </div>

        {/* Financial Tally layout */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
          
          <div className="flex justify-between text-gray-400 font-mono">
            <span>{lang === 'ar' ? "المجموع الفرعي" : "Subtotal"}</span>
            <span>{formatCurrency(calculateSubtotal(), currencySymbol, lang)}</span>
          </div>

          <div className="flex justify-between text-gray-400 font-mono">
            <span>{lang === 'ar' ? `ضريبة القيمة المضافة (${settings.taxRate}%)` : `VAT Sales Tax (${settings.taxRate}%)`}</span>
            <span>{formatCurrency(calculateTax(calculateSubtotal()), currencySymbol, lang)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold font-mono border-t border-dashed border-gray-100 dark:border-slate-800 pt-2.5">
            <span>{lang === 'ar' ? "الإجمالي النهائي" : "GRAND TOTAL"}</span>
            <span style={{ color: settings.primaryColor }}>{formatCurrency(calculateSubtotal() + calculateTax(calculateSubtotal()), currencySymbol, lang)}</span>
          </div>

          <button
            onClick={handleTriggerCheckoutModal}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2.5 py-3 disabled:opacity-40 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <span>{lang === 'ar' ? "دفع الفاتورة والطباعة" : "Proceed to Checkout"}</span>
            <ArrowRight className={`w-4 h-4 ${lang === "ar" ? "rotate-180" : ""}`} />
          </button>
        </div>

      </div>

      {/* Complete Checkout & Invoice Printer Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] animate-fade-in text-xs font-semibold text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Coins className="w-5 h-5 text-teal-600" />
                {lang === 'ar' ? "محطة دفع وإصدار الفاتورة الإلكترونية" : "Billing desk & E-Invoicing Portal"}
              </h3>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            {!checkoutSuccess ? (
              <form onSubmit={handleExecuteCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Panel Inputs */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label>{lang === 'ar' ? "اسم العميل (اختياري)" : "Customer Name (Optional)"}</label>
                    <input
                      type="text"
                      placeholder="e.g. Khalid Ahmad"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label>{lang === 'ar' ? "جوال العميل" : "Customer Phone"}</label>
                    <input
                      type="text"
                      placeholder="e.g. 0501234567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  {customers && customers.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
                        {lang === 'ar' ? "✨ اختيار من قسم العملاء" : "✨ Select Registered Loyal Client"}
                      </label>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                        {customers.slice(0, 5).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCustomerName(c.name);
                              setCustomerPhone(c.phone !== '-' ? c.phone : "");
                            }}
                            className="bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-gray-700 dark:text-gray-200 shrink-0 transition cursor-pointer border border-transparent hover:border-emerald-300"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 font-sans">
                    <label>{lang === 'ar' ? "تحديد بوابة الدفع" : "Payment Platform Gateway"}</label>
                    <div className="grid grid-cols-2 gap-2 font-bold font-mono">
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className="p-3 rounded-xl border flex items-center justify-center gap-2 transition border-slate-200 dark:border-slate-800"
                        style={paymentMethod === 'cash' ? {
                          backgroundColor: `${settings.primaryColor}13`,
                          borderColor: settings.primaryColor,
                          color: settings.primaryColor
                        } : {}}
                      >
                        <Coins className="w-4 h-4 shrink-0" />
                        <span>CASH</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className="p-3 rounded-xl border flex items-center justify-center gap-2 transition border-slate-200 dark:border-slate-800"
                        style={paymentMethod === 'card' ? {
                          backgroundColor: `${settings.primaryColor}13`,
                          borderColor: settings.primaryColor,
                          color: settings.primaryColor
                        } : {}}
                      >
                        <CreditCard className="w-4 h-4 shrink-0" />
                        <span>CARD</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className="p-3 rounded-xl border flex items-center justify-center gap-2 transition border-slate-200 dark:border-slate-800"
                        style={paymentMethod === 'wallet' ? {
                          backgroundColor: `${settings.primaryColor}13`,
                          borderColor: settings.primaryColor,
                          color: settings.primaryColor
                        } : {}}
                      >
                        <Wallet className="w-4 h-4 shrink-0" />
                        <span>MADA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('deferred')}
                        className="p-3 rounded-xl border flex items-center justify-center gap-2 transition border-slate-200 dark:border-slate-800"
                        style={paymentMethod === 'deferred' ? {
                          backgroundColor: `${settings.primaryColor}13`,
                          borderColor: settings.primaryColor,
                          color: settings.primaryColor
                        } : {}}
                        title="Deferred Payment / Tabby / Account"
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>DEFERRED</span>
                      </button>

                    </div>
                  </div>
                </div>

                {/* Right Panel computations */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                  <div className="space-y-3 font-mono text-sm text-right">
                    <div className="flex justify-between text-slate-400">
                      <span>{lang === 'ar' ? "إجمالي المبلغ المستحق" : "Grand Total Due:"}</span>
                      <span>{formatCurrency(calculateSubtotal() + calculateTax(calculateSubtotal()), currencySymbol, lang)}</span>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-xs text-slate-500 font-sans">{lang === 'ar' ? "المبلغ النقدي المسلم:" : "Cash Tendered by Buyer:"}</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-lg text-slate-800 dark:text-slate-100 font-bold font-mono focus:outline-none"
                      />
                    </div>

                    {parseFloat(cashReceived) > 0 && (
                      <div className="flex justify-between border-t border-dashed border-slate-300 pt-3 text-emerald-600 text-base font-bold">
                        <span>{lang === 'ar' ? "مبلغ الفكة المترتبة:" : "Change Balance:"}</span>
                        <span>
                          {formatCurrency(
                            Math.max((parseFloat(cashReceived) || 0) - (calculateSubtotal() + calculateTax(calculateSubtotal())), 0),
                            currencySymbol,
                            lang
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 text-white rounded-xl text-xs font-bold transition shadow-md mt-6 cursor-pointer"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {lang === 'ar' ? "تسجيل البيع وإصدار الفاتورة" : "Record order & Print Invoice"}
                  </button>
                </div>

              </form>
            ) : (
              // Receipt Preview and printer triggers
              <div className="space-y-6 flex flex-col items-center">
                
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 animate-fade-in w-full text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    {lang === 'ar' 
                      ? "تم تصديق الفاتورة بنجاح! تم حفظ البيانات وتعديل مستويات السلع في المستودع." 
                      : "Invoice validated successfully! Inventories aligned, databases saved to workspace."}
                  </span>
                </div>

                {/* Auto routed printers dispatch monitor */}
                <div className="w-full max-w-md bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5 text-right font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                      📡 {lang === 'ar' ? "منصة رصد توجيه الطابعات الفوري للأقسام" : "Live Section Printer Dispatch Hub"}
                    </span>
                    <span className="text-[10px] bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-extrabold px-2 py-0.5 rounded-full font-sans animate-pulse">
                      {lang === 'ar' ? "توجيه ذكي تلقائي" : "SMART ROUTING"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-semibold">
                    {activePrintersList.map((prn) => {
                      // Filter items that route to this printer
                      const itemMatches = prn.id === 'prn-cashier' 
                        ? (activeCreatedInvoice?.items || [])
                        : (activeCreatedInvoice?.items || []).filter(item => prn.categories && prn.categories.includes(item.product.category));
                      
                      const hasItems = itemMatches.length > 0;
                      if (!prn.isActive) return null;
                      if (!hasItems) return null;

                      const status = dispatchStatuses[prn.id] || 'routing';
                      const isSelected = selectedPrinterId === prn.id;

                      return (
                        <button
                          key={prn.id}
                          type="button"
                          onClick={() => setSelectedPrinterId(prn.id)}
                          className={`p-2.5 rounded-xl border transition text-right flex flex-col justify-between h-24 relative hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer ${
                            isSelected 
                              ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 ring-2 ring-teal-500/20 text-teal-950 dark:text-teal-200' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between w-full">
                              <span className="font-extrabold truncate max-w-[85px]">
                                {lang === 'ar' ? prn.nameAr : prn.nameEn}
                              </span>
                              <Printer className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                            </div>
                            <div className="text-[8px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                              <Network className="w-2.5 h-2.5" />
                              <span className="truncate">{prn.connectionValue}</span>
                            </div>
                            <div className="text-[8px] text-slate-600 dark:text-slate-300 font-sans mt-0.5 max-h-[22px] overflow-hidden truncate">
                              {itemMatches.map(it => `${it.quantity}x ${lang === 'ar' ? it.product.nameAr : it.product.nameEn}`).join(', ')}
                            </div>
                          </div>

                          <div className="mt-1 flex items-center justify-between w-full border-t border-slate-100 dark:border-slate-800 pt-1 text-[8px] font-sans">
                            <span className="text-[7.5px] opacity-70">
                              {prn.paperSize === "58mm" ? "58mm" : "80mm"}
                            </span>
                            {status === 'routing' ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 animate-pulse">
                                <Send className="w-2 h-2" />
                                {lang === 'ar' ? "جاري التوجيه" : "Routing"}
                              </span>
                            ) : status === 'sending' ? (
                              <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
                                <Wifi className="w-2 h-2 animate-bounce" />
                                {lang === 'ar' ? "إرسال حزم..." : "Sending pkg"}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-500" />
                                {lang === 'ar' ? "مطبوع بنجاح" : "Success"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[8.5px] text-slate-500 dark:text-slate-400 font-sans italic flex items-center justify-center gap-1.5 pt-1">
                    <span>💡 {lang === 'ar' ? "تم توجيه الأصناف تلقائياً لأقسامها. انقر على أي طابعة لمعاينتها وطباعة الفيش الموجه إليها." : "Items dispatched instantly! Click any department printer to preview and print its split receipt."}</span>
                  </div>
                </div>

                {/* 80mm / 58mm dynamic thermal receipt styled area (Printed view targeted) */}
                <div
                  id="receipt-print-area"
                  className={`${
                    currentPrinterPaperSize === "58mm" ? "w-[210px] p-2" : "w-[280px] p-4"
                  } bg-white text-black border border-slate-250 rounded-xl shadow text-center max-h-[460px] overflow-y-auto ${
                    settings.printerDensity === "dense" ? "space-y-1.5" : 
                    settings.printerDensity === "spacious" ? "space-y-4" : "space-y-3"
                  }`}
                  style={{ 
                    direction: "rtl",
                    fontSize: `${settings.receiptFontSize || 12}px`,
                    fontFamily: "monospace"
                  }}
                >
                  
                  {isCashierMaster ? (
                    (settings.receiptBlockOrder || ['logo', 'header', 'info', 'items', 'totals', 'qr', 'footer']).map((bId) => {
                      
                      if (bId === 'logo') {
                        if (settings.showReceiptLogo === false) return null;
                        return (
                          <div key="logo" className="pb-1 max-w-full">
                            {settings.logoUrl ? (
                              <img src={settings.logoUrl} alt="Logo" className={settings.printerPaperSize === "58mm" ? "w-10 h-10 mx-auto object-contain rounded" : "w-14 h-14 mx-auto object-contain rounded-lg"} />
                            ) : (
                              <span className="text-xl font-bold block">☕</span>
                            )}
                          </div>
                        );
                      }

                      if (bId === 'header') {
                        if (settings.showReceiptHeader === false) return null;
                        return (
                          <div key="header" className="pb-1">
                            <h3 className="font-extrabold text-[1.12em] tracking-tight text-black">
                              {lang === 'ar' ? settings.nameAr : settings.nameEn}
                            </h3>
                            <p className="text-[0.80em] text-slate-500 font-sans leading-relaxed mt-0.5">
                              {lang === 'ar' ? (settings.receiptHeaderAr || "الرقم الضريبي: 300092810000003") : (settings.receiptHeaderEn || "VAT ID: 300092810000003")}
                            </p>
                          </div>
                        );
                      }

                      if (bId === 'info') {
                        const hasEmp = settings.showReceiptEmployee !== false;
                        const hasCust = settings.showReceiptCustomer !== false;
                        if (!hasEmp && !hasCust) return null;
                        return (
                          <div key="info" className={`py-1.5 text-[0.82em] space-y-1 text-right font-mono ${settings.printerModel === "Xprint" ? "border-t border-b border-dashed border-slate-350" : "border-t border-b border-black"}`}>
                            <div><b>رقم الفاتورة:</b> {activeCreatedInvoice?.invoiceNumber}</div>
                            <div><b>التاريخ:</b> {activeCreatedInvoice ? new Date(activeCreatedInvoice.date).toLocaleString([], { hour12: true }) : ""}</div>
                            {hasEmp && <div><b>الكاشير:</b> {activeCreatedInvoice?.cashierName}</div>}
                            {hasCust && activeCreatedInvoice?.customerName && <div><b>العميل:</b> {activeCreatedInvoice.customerName}</div>}
                          </div>
                        );
                      }

                      if (bId === 'items') {
                        return (
                          <div key="items" className="py-1">
                            <table className="w-full text-right text-[0.82em]">
                              <thead>
                                <tr className={`${settings.printerModel === "Xprint" ? "border-b border-dashed border-slate-350" : "border-b border-black"} font-bold`}>
                                  <th>الصنف</th>
                                  <th className="text-center font-bold">الكمية</th>
                                  <th className="text-left font-bold">السعر</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {activeCreatedInvoice?.items.map((item, id) => (
                                  <tr key={id}>
                                    <td className="py-1 text-right">
                                      {lang === "ar" ? item.product.nameAr : item.product.nameEn}
                                    </td>
                                    <td className="py-1 text-center">{item.quantity}</td>
                                    <td className="py-1 text-left">{(item.product.price * item.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      if (bId === 'totals') {
                        const hasTax = settings.showReceiptTax !== false;
                        const symbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;
                        return (
                          <div key="totals" className={`pt-2 text-[0.82em] space-y-1 text-right font-mono ${settings.printerModel === "Xprint" ? "border-t border-dashed border-slate-350" : "border-t border-black"}`}>
                            <div className="flex justify-between">
                              <span>المجموع الفرعي:</span>
                              <span>{activeCreatedInvoice?.subtotal.toFixed(2)} {symbol}</span>
                            </div>
                            {hasTax && (
                              <div className="flex justify-between">
                                <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                                <span>{activeCreatedInvoice?.tax.toFixed(2)} {symbol}</span>
                              </div>
                            )}
                            <div className={`flex justify-between font-extrabold text-[1.12em] pt-1 mt-0.5 ${settings.printerModel === "Xprint" ? "border-t border-dashed border-slate-350" : "border-t border-dotted border-black/40"}`}>
                              <span>الإجمالي النهائي:</span>
                              <span>{activeCreatedInvoice?.total.toFixed(2)} {symbol}</span>
                            </div>
                          </div>
                        );
                      }

                      if (bId === 'qr') {
                        if (settings.showReceiptQr === false) return null;
                        return activeCreatedInvoice?.qrCodeUrl ? (
                          <div key="qr" className="py-2 flex flex-col items-center justify-center">
                            <img src={activeCreatedInvoice.qrCodeUrl} alt="E-Invoice QR" className={settings.printerPaperSize === "58mm" ? "w-20 h-20 border border-slate-100 p-1" : "w-24 h-24 border border-slate-100 p-1"} />
                            <span className="text-[0.65em] text-slate-500 font-sans mt-1 text-center font-bold tracking-tight">
                              {lang === 'ar' ? "فاتورة إلكترونية مبسطة مدمجة" : "Verified Simplified E-Invoice"}
                            </span>
                          </div>
                        ) : null;
                      }

                      if (bId === 'footer') {
                        if (settings.showReceiptFooter === false) return null;
                        return (
                          <p key="footer" className={`text-[0.76em] text-slate-500 italic mt-3 text-center pt-2 font-mono ${settings.printerModel === "Xprint" ? "border-t border-dashed border-slate-350" : "border-t border-dotted border-slate-300"}`}>
                            {lang === 'ar' ? (settings.receiptFooterAr || "شاهدنا زيارتكم دوماً، طاب يومكم 🌸") : (settings.receiptFooterEn || "Thank you for visiting us! Have a nice day.")}
                          </p>
                        );
                      }

                      return null;
                    })
                  ) : (
                    // Specialized split prepare slips for kitchen / bar
                    <div className="space-y-3.5 text-right">
                      <div className="pb-1 text-center">
                        <span className="text-2xl block mb-1">📟</span>
                        <span className="text-[10px] font-black px-2.5 py-0.5 bg-black text-white rounded uppercase tracking-wider">
                          {lang === 'ar' ? selectedPrinterObj.nameAr : selectedPrinterObj.nameEn}
                        </span>
                      </div>

                      <div className="text-center pb-1.5 border-b border-dashed border-black">
                        <h4 className="font-extrabold text-[1.1em] tracking-wide text-black font-sans">
                          {lang === 'ar' ? `فيش تحضير - قسم ${selectedPrinterObj.nameAr.replace("طابعة", "").trim()}` : `PREPARATION SLIP - ${selectedPrinterObj.nameEn}`}
                        </h4>
                        <div className="text-[0.75em] text-black font-mono mt-0.5 font-bold">
                          {lang === 'ar' ? `اتصال الشبكة: ${selectedPrinterObj.connectionValue}` : `Network Channel: ${selectedPrinterObj.connectionValue}`}
                        </div>
                      </div>

                      <div className="py-1.5 text-[0.80em] space-y-1 border-b border-dashed border-black font-mono text-black">
                        <div><b>رقم الكاشير:</b> {activeCreatedInvoice?.invoiceNumber}</div>
                        <div><b>تاريخ الإنتاج:</b> {activeCreatedInvoice ? new Date(activeCreatedInvoice.date).toLocaleString([], { hour12: true }) : ""}</div>
                        {activeCreatedInvoice?.customerName && <div><b>تفاصيل العميل:</b> {activeCreatedInvoice.customerName}</div>}
                      </div>

                      <div className="py-1">
                        <table className="w-full text-right text-[0.85em]">
                          <thead>
                            <tr className="border-b border-black font-bold">
                              <th className="py-1 font-bold">الصنف المطلوب للمطبخ</th>
                              <th className="py-1 text-center w-[60px] font-bold">الكمية</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10 font-sans">
                            {itemsToDisplay.map((item, id) => (
                              <tr key={id} className="border-b border-dashed border-black/20">
                                <td className="py-2.5 text-[1.1em] text-right font-black text-black">
                                  {lang === "ar" ? item.product.nameAr : item.product.nameEn}
                                </td>
                                <td className="py-2.5 text-center text-[1.35em] font-black text-black bg-slate-100 rounded-md border border-slate-300">
                                  {item.quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-2 text-[0.80em] text-center font-bold border-t border-dashed border-black">
                        <div className="font-black tracking-widest text-black">
                          {lang === 'ar' ? "*** يرجى البدء بالطهي والتحضير فوراً ***" : "*** PREPARE AND SERVE IMMEDIATELY ***"}
                        </div>
                        <p className="text-[0.72em] text-slate-500 italic mt-3 pt-2 border-t border-dotted border-black/30">
                          {lang === 'ar' ? "نموذج توجيه لاسلكي موحد آمن" : "Wireless unified thermal route complete."}
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                <div className="flex gap-2.5 w-full">
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition font-extrabold text-xs"
                  >
                    {lang === 'ar' ? "إغلاق النافذة" : "Close Screen"}
                  </button>
                  
                  <button
                    onClick={handleThermalPrint}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl flex items-center justify-center gap-1.5 transition shadow text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{lang === 'ar' ? `طباعة الفيش [${selectedPrinterObj.nameAr.split('(')[0].trim()}]` : `Print [${selectedPrinterObj.nameEn}]`}</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Table Select / Import Modal */}
      {showTableSelectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] animate-fade-in text-xs font-semibold text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-sans">
                <Utensils className="w-4.5 h-4.5 text-amber-500 hover:rotate-12 transition-transform" />
                <span>{lang === 'ar' ? "سحب طلب طاولة نشط" : "Pull Dine-In Table Order"}</span>
              </h3>
              <button
                onClick={() => setShowTableSelectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-gray-400 font-sans leading-normal mb-4 text-right">
              {lang === 'ar' 
                ? "اختر طاولة مشغولة من الصالة لسحب طلبات الويتر المعلقة مباشرة إلى سلة الكاشير لإجراء الدفع والفوترة الإلكترونية." 
                : "Select an active floor table with pending waiter orders to load directly into the POS checkout."
              }
            </p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {tables && tables.filter(t => t.items.length > 0).map((t) => {
                const totalAmount = t.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                const vatAmount = settings.enableVat ? totalAmount * (settings.taxRate / 100) : 0;
                const grandTotal = totalAmount + vatAmount;

                return (
                  <button
                    key={t.tableId}
                    type="button"
                    onClick={() => {
                      setCart([...t.items]);
                      setImportedTableId(t.tableId);
                      setCustomerName(lang === 'ar' ? `${t.tableNameAr}` : `${t.tableNameEn}`);
                      setShowTableSelectModal(false);
                    }}
                    className="w-full p-4 bg-gray-50/50 dark:bg-slate-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between transition cursor-pointer hover:border-emerald-550 group select-none text-right"
                  >
                    <div>
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition block">
                        {lang === 'ar' ? t.tableNameAr : t.tableNameEn}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                        {lang === 'ar' ? `${t.items.length} أصناف معلقة` : `${t.items.length} pending items`}
                      </span>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white block">
                        {formatCurrency(grandTotal, currencySymbol, lang)}
                      </span>
                      <span className="text-[9px] text-emerald-650 block font-sans font-bold mt-0.5 uppercase tracking-wide group-hover:underline">
                        {lang === 'ar' ? "اسحب للتحميل" : "Click to Pull"}
                      </span>
                    </div>
                  </button>
                );
              })}

              {(!tables || !tables.some(t => t.items.length > 0)) && (
                <div className="text-center py-8">
                  <Utensils className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                  <p className="text-[11px] text-gray-400 font-sans">
                    {lang === 'ar' ? "لا توجد طاولات مشغولة بالصالة حالياً." : "No active dine-in table orders currently found."}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 text-left font-sans">
              <button
                type="button"
                onClick={() => setShowTableSelectModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {lang === 'ar' ? "إلغاء" : "Dismiss"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
