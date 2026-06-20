import React, { useState } from "react";
import { 
  Utensils, 
  Clock, 
  Plus, 
  Minus, 
  Printer, 
  AlertCircle,
  Check,
  Search,
  BookOpen,
  ArrowRight,
  Receipt,
  UserCheck
} from "lucide-react";
import { Product, OrderItem, TableOrder, CafeSettings, Category } from "../types";

interface TablesViewProps {
  lang: 'ar' | 'en';
  inventory: Product[];
  tables: TableOrder[];
  onUpdateTable: (tableId: string, items: OrderItem[], customOccupiedSince?: string) => void;
  onAddTable: (tableNameAr: string, tableNameEn: string) => void;
  settings: CafeSettings;
  categories: Category[];
}

export default function TablesView({
  lang,
  inventory,
  tables,
  onUpdateTable,
  onAddTable,
  settings,
  categories = []
}: TablesViewProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tempCart, setTempCart] = useState<OrderItem[]>([]);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [slipTable, setSlipTable] = useState<TableOrder | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  
  // Dynamic tick state to force view update for active table durations
  const [, setRefreshTick] = useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setRefreshTick(tick => tick + 1);
    }, 15000); // refresh every 15 seconds
    return () => clearInterval(timer);
  }, []);
  
  // Custom Table creation modal states
  const [showAddTableModal, setShowAddTableModal] = useState<boolean>(false);
  const [newTableNameAr, setNewTableNameAr] = useState<string>("");
  const [newTableNameEn, setNewTableNameEn] = useState<string>("");

  // Get current active table details
  const activeTable = tables.find(t => t.tableId === selectedTableId);

  // Category filter tabs
  const categoriesList = [
    { key: "all", labelAr: "الكل", labelEn: "All Items" },
    ...categories
  ];

  // Handle table click
  const handleSelectTable = (table: TableOrder) => {
    setSelectedTableId(table.tableId);
    setTempCart([...table.items]);
    setSuccessAnimation(false);
  };

  // Filter products by category and search term
  const filteredProducts = inventory.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = 
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  // Currency utility helper
  const formatCurrency = (val: number, symbol: string, currentLang: string) => {
    return currentLang === 'ar' 
      ? `${val.toFixed(2)} ${symbol}` 
      : `${symbol} ${val.toFixed(2)}`;
  };

  const currencySymbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;

  // Add product to temporary cart
  const handleProductSelect = (p: Product) => {
    if (p.quantity <= 0) return; // Out of stock
    
    setTempCart(prev => {
      const existing = prev.find(item => item.product.id === p.id);
      if (existing) {
        // Enforce inventory limit
        if (existing.quantity >= p.quantity) return prev;
        return prev.map(item => 
          item.product.id === p.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { product: p, quantity: 1 }];
      }
    });
  };

  // Modify quantity in temporary cart
  const handleUpdateQuantity = (index: number, delta: number) => {
    setTempCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      const nextQty = item.quantity + delta;
      
      if (nextQty <= 0) {
        updated.splice(index, 1);
      } else {
        // Verify inventory limits
        if (delta > 0 && nextQty > item.product.quantity) return prev;
        updated[index] = { ...item, quantity: nextQty };
      }
      return updated;
    });
  };

  // Calculate Subtotal for the active temp cart
  const calculateSubtotal = () => {
    return tempCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  // Calculate VAT Tax
  const calculateTax = (sub: number) => {
    if (!settings.enableVat) return 0;
    return sub * (settings.taxRate / 100);
  };

  // Save changes to Table
  const handleSaveToTable = () => {
    if (!selectedTableId) return;
    onUpdateTable(selectedTableId, tempCart);
    setSuccessAnimation(true);
    setTimeout(() => {
      setSuccessAnimation(false);
    }, 2500);
  };

  // Simulate 45m+ occupancy turnover alert
  const handleSimulateOver45M = () => {
    if (!selectedTableId) return;
    let currentCart = [...tempCart];
    if (currentCart.length === 0 && inventory.length > 0) {
      currentCart = [{ product: inventory[0], quantity: 1 }];
      setTempCart(currentCart);
    }
    const fiftyMinsAgo = new Date(Date.now() - 50 * 60 * 1000).toISOString();
    onUpdateTable(selectedTableId, currentCart, fiftyMinsAgo);
  };

  // Trigger print slip modal
  const handleOpenPrintSlip = () => {
    if (!selectedTableId || tempCart.length === 0) return;
    setSlipTable({
      tableId: selectedTableId,
      tableNameAr: activeTable?.tableNameAr || "",
      tableNameEn: activeTable?.tableNameEn || "",
      items: [...tempCart],
      status: 'occupied',
      updatedAt: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    });
    setShowPrintModal(true);
  };

  const currentPrintedTotal = slipTable 
    ? slipTable.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Table Status Header Warning */}
      <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-tight">
              {lang === 'ar' ? "لوحة ويتر الصالة - طلبات الطاولات" : "Waiter الصالة POS Client & Table Ordering"}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
              {lang === 'ar' 
                ? "يتم تدوين وحفظ طلبات الطاولات وترحيلها لحظياً. الدفع وإقفال الحساب يتم حصراً من شاشة الكاشير الرئيسي لضبط النقدية والمبيعات." 
                : "Record, persist, and update live table orders. Settlement and final invoicing CAN ONLY be executed at the main checkout cashier."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Grid of Tables */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-slate-400 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-gray-400" />
                <span>{lang === "ar" ? "قائمة طاولات الصالة" : "Floor Tables"}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setNewTableNameAr("");
                  setNewTableNameEn("");
                  setShowAddTableModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white uppercase rounded-lg transition hover:opacity-90 cursor-pointer shadow-xs"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "إضافة طاولة" : "Add Table"}</span>
              </button>
            </div>

            {/* Grid of Tables */}
            <div className="grid grid-cols-2 gap-3">
              {tables.map((t) => {
                const isSelected = selectedTableId === t.tableId;
                const isOccupied = t.items.length > 0;
                
                // Calculate elapsed occupancy minutes
                let minutesOccupied = 0;
                if (isOccupied) {
                  const sinceTime = t.occupiedSince || t.updatedAt;
                  if (sinceTime) {
                    const diffMs = Date.now() - new Date(sinceTime).getTime();
                    minutesOccupied = Math.floor(diffMs / (1000 * 60));
                  }
                }
                const isOverLimit = isOccupied && minutesOccupied >= 45;

                // Calculate table total
                const tableSum = t.items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
                const vatAmt = settings.enableVat ? tableSum * (settings.taxRate / 100) : 0;
                const tableGrandTotal = tableSum + vatAmt;

                return (
                  <button
                    key={t.tableId}
                    onClick={() => handleSelectTable(t)}
                    className={`p-4 rounded-2xl border text-right flex flex-col justify-between h-28 transition-all group cursor-pointer ${
                      isOverLimit
                        ? "animate-border-pulse bg-red-50/10 dark:bg-red-950/5"
                        : isSelected 
                          ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20" 
                          : isOccupied
                            ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-250 hover:bg-amber-50/60"
                            : "bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800/70 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <b className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                        {lang === 'ar' ? t.tableNameAr : t.tableNameEn}
                      </b>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOccupied && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5 ${
                            isOverLimit 
                              ? "bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold" 
                              : "bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                          }`}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{minutesOccupied}m</span>
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${
                          isOverLimit
                            ? "bg-red-550 animate-ping"
                            : isOccupied 
                              ? "bg-amber-500 animate-pulse" 
                              : "bg-gray-300 dark:bg-slate-700"
                        }`} />
                      </div>
                    </div>

                    <div className="text-right w-full">
                      {isOccupied ? (
                        <div className="flex items-end justify-between w-full">
                          <div className="space-y-0.5 text-right">
                            <span className={`text-[10px] font-bold block ${isOverLimit ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                              {lang === 'ar' ? `${t.items.length} منتجات` : `${t.items.length} items`}
                            </span>
                            <span className="text-[11px] font-bold font-mono text-gray-900 dark:text-white mt-1 block">
                              {formatCurrency(tableGrandTotal, currencySymbol, lang)}
                            </span>
                          </div>
                          {isOverLimit && (
                            <span className="text-[9px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-tight animate-pulse bg-red-100 dark:bg-red-950/50 px-1.5 py-0.5 rounded-md">
                              {lang === 'ar' ? "تحذير!" : "Turnover!"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 block font-mono">
                          {lang === 'ar' ? "شاغرة" : "Idle Empty"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Active table order composition */}
        <div className="xl:col-span-8">
          {selectedTableId ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Product catalog for the active table */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Search & Category Tabs */}
                <div className="bg-white dark:bg-[#111827] p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800/80 shadow-xs space-y-3 font-sans">
                  <div className="relative bg-gray-50/50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? "ابحث عن منتج بالاسم..." : "Find hot latte, croissants, matcha..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs bg-transparent border-none outline-none text-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {categoriesList.map((c) => {
                      const isActive = activeCategory === c.key;
                      return (
                        <button
                          key={c.key}
                          onClick={() => setActiveCategory(c.key)}
                          className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition ${
                            isActive
                              ? "text-white border-transparent"
                              : "bg-white dark:bg-[#111827] border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-350 hover:bg-gray-50"
                          }`}
                          style={isActive ? { backgroundColor: settings.primaryColor } : {}}
                        >
                          {lang === 'ar' ? c.labelAr : c.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.quantity <= 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleProductSelect(p)}
                        disabled={isOutOfStock}
                        className={`p-3 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 shadow-xs rounded-xl flex flex-col justify-between text-right transition group select-none ${
                          isOutOfStock 
                            ? "opacity-55 cursor-not-allowed" 
                            : "hover:border-emerald-500 active:scale-98 cursor-pointer"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] bg-gray-50 dark:bg-slate-850 text-gray-500 px-1.5 py-0.5 rounded font-mono font-semibold">
                              {p.quantity > 0 ? `${p.quantity} qty` : "SOLD OUT"}
                            </span>
                          </div>
                          <b className="text-[12px] font-bold block truncate leading-snug text-gray-900 dark:text-white">
                            {lang === 'ar' ? p.nameAr : p.nameEn}
                          </b>
                          <span className="text-[9px] text-gray-400 font-mono block mt-0.5">{p.barcode}</span>
                        </div>
                        
                        <p className="text-[13px] font-bold font-mono mt-3 leading-none text-emerald-600 dark:text-emerald-400" style={{ color: settings.primaryColor }}>
                          {formatCurrency(p.price, currencySymbol, lang)}
                        </p>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Cart List for table on the right */}
              <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col h-[70vh] justify-between shadow-xs">
                
                {/* Title */}
                <div className="pb-3 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-xs uppercase text-gray-900 dark:text-white truncate font-sans">
                      {lang === 'ar' 
                        ? `طلبات ${activeTable?.tableNameAr}` 
                        : `${activeTable?.tableNameEn} Order`
                      }
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 self-end">
                    <button
                      type="button"
                      onClick={handleSimulateOver45M}
                      className="p-1 px-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                      title={lang === 'ar' ? "محاكاة إشغال الطاولة لأكثر من ٤٥ دقيقة" : "Simulate >45m occupancy warning alert"}
                    >
                      <Clock className="w-3 h-3 animate-pulse text-red-500" />
                      <span>{lang === 'ar' ? "تجربة ٤٥د+" : "Test 45m+"}</span>
                    </button>
                    <button
                      onClick={() => setTempCart([])}
                      disabled={tempCart.length === 0}
                      className="p-1 px-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-100/60 rounded-lg text-[10px] font-bold uppercase transition disabled:opacity-45 cursor-pointer"
                    >
                      {lang === 'ar' ? "تصفير" : "Clear"}
                    </button>
                  </div>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                  {tempCart.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50/50 dark:bg-slate-900/40 rounded-xl flex justify-between items-center border border-gray-100 dark:border-slate-800/60 transition">
                      
                      <div className="space-y-1 max-w-[130px] text-right">
                        <b className="text-[11px] font-bold block truncate text-gray-900 dark:text-white">
                          {lang === 'ar' ? item.product.nameAr : item.product.nameEn}
                        </b>
                        <span className="text-[10px] font-mono text-gray-400 block">
                          {formatCurrency(item.product.price, currencySymbol, lang)} x {item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="px-1.5 py-0.5 bg-gray-150 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 rounded font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold px-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          disabled={item.quantity >= item.product.quantity}
                          className="px-1.5 py-0.5 bg-gray-150 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 rounded font-bold text-xs disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                    </div>
                  ))}

                  {tempCart.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-4 py-12">
                      <Utensils className="w-8 h-8 text-gray-300 dark:text-slate-700 mb-2.5" />
                      <p className="text-[11px] text-gray-400 font-sans text-center leading-normal">
                        {lang === 'ar' 
                          ? "الطاولة فارغة حالياً. أضف سلعاً من اللائحة لحفظها." 
                          : "This table is empty. Tap products to build table order statement."
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Pricing totals & controls */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2.5 text-xs">
                  
                  <div className="flex justify-between text-gray-400 font-mono">
                    <span>{lang === 'ar' ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span>{formatCurrency(calculateSubtotal(), currencySymbol, lang)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400 font-mono">
                    <span>{lang === 'ar' ? `الضريبة (${settings.taxRate}%)` : `VAT Tax (${settings.taxRate}%)`}</span>
                    <span>{formatCurrency(calculateTax(calculateSubtotal()), currencySymbol, lang)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold font-mono border-t border-dashed border-gray-100 dark:border-slate-850 pt-2 bg-slate-50/50 p-1.5 rounded-lg">
                    <span>{lang === 'ar' ? "إجمالي كشف الطاولة" : "TABLE STATEMENT SUM"}</span>
                    <span style={{ color: settings.primaryColor }}>
                      {formatCurrency(calculateSubtotal() + calculateTax(calculateSubtotal()), currencySymbol, lang)}
                    </span>
                  </div>

                  {/* Feedback status banner */}
                  {successAnimation && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-center text-[10px] font-bold animate-pulse">
                      {lang === 'ar' 
                        ? "✓ تم ترحيل وحفظ الطلبات على الطاولة بنجاح!" 
                        : "✓ Order updated & saved on table successfully!"
                      }
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleSaveToTable}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'ar' ? "حفظ وتعديل الطاولة" : "Save Table Session"}</span>
                    </button>

                    <button
                      onClick={handleOpenPrintSlip}
                      disabled={tempCart.length === 0}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-gray-700 dark:text-gray-100 font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-40"
                    >
                      <Printer className="w-4 h-4" />
                      <span>{lang === 'ar' ? "كشف الطاولة / المطبخ" : "Print Table Slip"}</span>
                    </button>
                  </div>

                  {/* Mandatory Alert indicating Direct Payment is disabled for waitstaff */}
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-xl flex items-center gap-2 text-[10px] text-amber-800 dark:text-amber-400 font-semibold font-sans mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'ar' 
                        ? "الدفع معطل من جهاز ويتر الصالة - يجب السداد عند الكاشير الرئيسي بطلب طاولة." 
                        : "Payment processing disabled - customer must settle order draft at Main Cashier Desk."
                      }
                    </span>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <Utensils className="w-12 h-12 text-gray-300 dark:text-slate-700 mb-4 animate-bounce" />
              <h4 className="font-bold text-gray-900 dark:text-white leading-normal">
                {lang === 'ar' ? "يرجى تحديد أو اختيار طاولة للبدء" : "Please select a floor table to begin"}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1 max-w-md">
                {lang === 'ar' 
                  ? "اختر طاولة من القائمة الجانبية لإدارة طلباتها وحفظها، أو إصدار كشف المطبخ والزبائن المؤقت." 
                  : "Tap a dine-in table card on the left panel to record and update menu items, or compile kitchen order slips."
                }
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Slip / Intermediate Receipt Print Modal */}
      {showPrintModal && slipTable && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] animate-fade-in text-xs text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-500" />
                {lang === 'ar' ? "مسودة تذكرة طلب طاولة" : "Table Slip Preview / Check"}
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-black"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Frame Area */}
            <div
              id="table-receipt-print-area"
              className={`${
                settings.printerPaperSize === "58mm" ? "w-[210px] p-2" : "w-[280px] p-4"
              } bg-white border border-dashed border-gray-300 text-gray-900 rounded-2xl font-mono mx-auto ${
                settings.printerDensity === "dense" ? "space-y-2 text-[0.9em]" : 
                settings.printerDensity === "spacious" ? "space-y-5 text-[1.05em]" : "space-y-4"
              }`}
              style={{
                fontSize: `${settings.receiptFontSize || 12}px`,
              }}
            >
              
              {/* Header */}
              <div className="text-center space-y-1">
                <h4 className="text-sm font-extrabold tracking-wide uppercase">
                  {lang === 'ar' ? settings.nameAr : settings.nameEn}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {lang === 'ar' ? "تذكرة كشف طاولة غير مدفوعة" : "UNPAID TABLE STATEMENT"}
                </p>
                <div className="text-[9px] bg-amber-500 text-black font-extrabold py-0.5 px-2 rounded tracking-widest inline-block uppercase my-1">
                  {lang === 'ar' 
                    ? `رقم: ${slipTable.tableNameAr}` 
                    : `Draft Area: ${slipTable.tableNameEn}`
                  }
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-0.5 text-[10px] text-gray-600 border-b border-dashed border-gray-200 pb-2.5">
                <div className="flex justify-between">
                  <span>{lang === "ar" ? "الوقت والتاريخ:" : "Timestamp:"}</span>
                  <span>{new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour12: false, dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "ar" ? "درجة الصلاحية:" : "Station:"}</span>
                  <span>{lang === "ar" ? "جهاز الويتر المحمول" : "Waitstaff Mobile Client"}</span>
                </div>
                <div className="flex justify-between font-bold text-black border-t border-dashed border-gray-100 pt-1 mt-1">
                  <span>{lang === "ar" ? "حالة المستند:" : "Status:"}</span>
                  <span className="text-amber-600">PENDING PAY AT CASHIER</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 text-[10.5px] border-b border-dashed border-gray-200 pb-2.5">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[9px] text-gray-400 uppercase tracking-wider font-sans border-b border-gray-100">
                      <th className="pb-1 text-right">{lang === 'ar' ? "المنتج" : "Item"}</th>
                      <th className="pb-1 text-center">{lang === 'ar' ? "الكمية" : "Qty"}</th>
                      <th className="pb-1 text-left">{lang === 'ar' ? "السعر" : "Price"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slipTable.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-50/50 font-mono">
                        <td className="py-1 text-right font-bold">
                          {lang === 'ar' ? item.product.nameAr : item.product.nameEn}
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-left">
                          {formatCurrency(item.product.price, currencySymbol, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tally Computations */}
              <div className="space-y-1 text-[11px] font-bold text-gray-800">
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? "المجموع الفرعي:" : "Subtotal:"}</span>
                  <span>{formatCurrency(currentPrintedTotal, currencySymbol, lang)}</span>
                </div>
                
                {settings.enableVat && (
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? `ضريبة (${settings.taxRate}%):` : `VAT (${settings.taxRate}%):`}</span>
                    <span>{formatCurrency(currentPrintedTotal * (settings.taxRate / 100), currencySymbol, lang)}</span>
                  </div>
                )}

                <div className="flex justify-between text-black text-xs font-black border-t border-dashed border-gray-300 pt-2">
                  <span>{lang === 'ar' ? "الإجمالي المؤقت:" : "GRAND TOTAL DRAFT:"}</span>
                  <span>{formatCurrency(currentPrintedTotal + (settings.enableVat ? currentPrintedTotal * (settings.taxRate / 100) : 0), currencySymbol, lang)}</span>
                </div>
              </div>

              {/* Notice explaining next step */}
              <div className="text-center font-sans space-y-2.5 pt-3 border-t border-dashed border-gray-200 text-gray-500 text-[10px] leading-tight select-none">
                <p className="font-bold text-amber-700 dark:text-amber-500">
                  ⚠️ {lang === 'ar' ? "هذه ليست فاتورة ضريبية نهائية" : "THIS IS NOT A FINAL TAX INVOICE"}
                </p>
                <p>
                  {lang === 'ar' 
                    ? "يرجى اصطحاب هذا الكشف والتوجه إلى الكاشير الرئيسي لإتمام الدفع وإصدار الفاتورة الضريبية المبسطة." 
                    : "Please present this draft slip at the Main Cashier desk to settle payment and issue final electronic invoice."
                  }
                </p>
                <p className="text-[9px] uppercase tracking-wide text-gray-400 mt-2">
                  {lang === 'ar' ? settings.receiptFooterAr : settings.receiptFooterEn}
                </p>
              </div>

            </div>

            {/* Print action trigger */}
            <div className="mt-5 grid grid-cols-2 gap-2 font-sans font-bold">
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ar' ? "طباعة تذكرة" : "Trigger Printer"}</span>
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl transition border border-gray-200 text-center cursor-pointer"
              >
                {lang === 'ar' ? "إغلاق المعاينة" : "Dismiss Preview"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Floor Table Modal dialog */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 animate-fade-in text-xs font-semibold text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-800 dark:text-slate-205 flex items-center gap-1.5 font-sans">
                <Utensils className="w-4.5 h-4.5 text-emerald-500" />
                <span>{lang === 'ar' ? "إضافة طاولة صالة جديدة" : "Add New Floor Table"}</span>
              </h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onAddTable(newTableNameAr, newTableNameEn);
                setShowAddTableModal(false);
                setNewTableNameAr("");
                setNewTableNameEn("");
              }}
              className="space-y-4 text-right"
            >
              
              {/* Input Arabic Label */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">
                  {lang === 'ar' ? "اسم الطاولة بالعربية" : "Table Name (Arabic)"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? "مثال: طاولة 11، طاولة VIP" : "e.g., طاولة 11"}
                  value={newTableNameAr}
                  onChange={(e) => setNewTableNameAr(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 dark:text-gray-100 transition text-right"
                />
              </div>

              {/* Input English Label */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block text-left">
                  {lang === 'ar' ? "اسم الطاولة بالإنجليزية" : "Table Name (English)"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? "مثال: Table 11, VIP Bar" : "e.g., Table 11"}
                  value={newTableNameEn}
                  onChange={(e) => setNewTableNameEn(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-805 rounded-xl outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 dark:text-gray-100 transition text-left"
                />
              </div>

              {/* Bottom Submit Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {lang === 'ar' ? "إلغاء التراجع" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white text-xs font-bold rounded-xl transition hover:opacity-90 cursor-pointer shadow-xs"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {lang === 'ar' ? "تأكيد الإضافة" : "Confirm Addition"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
