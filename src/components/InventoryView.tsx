/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Minus, Search, PackageMinus, AlertTriangle, Pencil, Trash, ShieldAlert, Barcode } from "lucide-react";
import { Product, Category } from "../types";

interface InventoryViewProps {
  lang: 'ar' | 'en';
  inventory: Product[];
  onAddProduct: (prod: Product) => void;
  onUpdateInventoryQuantity: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
  settings: any;
  categories: Category[];
  onAddCategory: (cat: Category) => void;
  onDeleteCategory: (key: string) => void;
}

export default function InventoryView({
  lang,
  inventory,
  onAddProduct,
  onUpdateInventoryQuantity,
  onDeleteProduct,
  settings,
  categories = [],
  onAddCategory,
  onDeleteCategory
}: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for custom creations
  const [newArName, setNewArName] = useState("");
  const [newEnName, setNewEnName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newMinQty, setNewMinQty] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newBarcode, setNewBarcode] = useState("");

  // Category Manager helper states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatLabelAr, setNewCatLabelAr] = useState("");
  const [newCatLabelEn, setNewCatLabelEn] = useState("");

  const categoriesList = [
    { key: "all", labelAr: "كل المخزون", labelEn: "All Inventory" },
    ...categories
  ];

  const lowStockItems = inventory.filter(p => p.quantity <= p.minQuantity);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArName.trim() || !newEnName.trim() || !newPrice || !newQty) return;

    const customProduct: Product = {
      id: `prod-custom-${Date.now()}`,
      nameAr: newArName,
      nameEn: newEnName,
      price: parseFloat(newPrice) || 0,
      cost: parseFloat(newCost) || 0,
      quantity: parseInt(newQty) || 0,
      minQuantity: parseInt(newMinQty) || 10,
      category: newCategory,
      barcode: newBarcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      isAvailable: true
    };

    onAddProduct(customProduct);
    setShowAddModal(false);

    // Reset fields
    setNewArName("");
    setNewEnName("");
    setNewPrice("");
    setNewCost("");
    setNewQty("");
    setNewMinQty("");
    setNewBarcode("");
  };

  const filteredItems = inventory.filter(p => {
    const matchesSearch = 
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Stock critical alarms */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-r-4 border-amber-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <b className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? "تنبيه تلقائي: عجز ونقص في بعض مستلزمات المخزون!" : "Automatic Notification: Critical stock shortages!"}
              </b>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                {lang === 'ar' 
                  ? `هناك ${lowStockItems.length} عنصر شارف على النفاد في المستودع. الرجاء التنسيق مع جهات التوريد أو إجراء الطلبيات وتعديل مستوياتها البرية فوراً لدعم المبيعات الصباحية.` 
                  : `There are ${lowStockItems.length} items with quantities below thresholds. Kindly restock segera to maintain fluid morning cashier checkouts.`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {lowStockItems.slice(0, 3).map(p => (
              <span key={p.id} className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900 text-amber-750 dark:text-amber-300 px-2 py-1 rounded">
                {lang === 'ar' ? p.nameAr : p.nameEn} ({p.quantity})
              </span>
            ))}
            {lowStockItems.length > 3 && <span className="text-[10px] text-slate-400 font-mono flex items-center">+{lowStockItems.length - 3}</span>}
          </div>
        </div>
      )}

      {/* Control row with add product trigger */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
                  isActive
                    ? "text-white border-transparent shadow"
                    : "bg-white dark:bg-[#111827] border-gray-150 dark:border-slate-800 text-gray-650 dark:text-gray-300 hover:bg-gray-50/75"
                }`}
                style={isActive ? { backgroundColor: settings.primaryColor } : {}}
              >
                {lang === "ar" ? cat.labelAr : cat.labelEn}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Manage Categories Trigger */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-205 rounded-xl text-xs font-bold transition w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'ar' ? "إدارة أقسام المنتجات" : "Manage Categories"}</span>
          </button>

          {/* Add Product Trigger */}
          <button
            onClick={() => {
              setShowAddModal(true);
              if (categories.length > 0) {
                setNewCategory(categories[0].key);
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold transition shadow-xs w-full sm:w-auto cursor-pointer"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? "إضافة منتج جديد" : "Establish New Product"}</span>
          </button>
        </div>
      </div>

      {/* Search and Table block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'ar' ? "شريط البحث بالاسم أو الباركود..." : "Filter catalog items by name or scan barcode..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 text-xs bg-transparent border-none outline-none text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-4">{lang === 'ar' ? "العنصر" : "Cafe Item"}</th>
                <th className="p-4">{lang === 'ar' ? "Barcode رمز الباركود" : "Barcode (Scan ID)"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "التكلفة" : "Unit Cost"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "سعر البيع" : "Selling Price"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "كمية المخزون الحالي" : "Current Quantity"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "المستوى الحرج ترحيل" : "Min Limit"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "أوامر سريعة" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filteredItems.map((p) => {
                const isUnderStocked = p.quantity <= p.minQuantity;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <b className="text-[13px] text-slate-800 dark:text-slate-100 block">
                          {lang === "ar" ? p.nameAr : p.nameEn}
                        </b>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">
                          {p.category.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-500 flex items-center gap-1.5 pt-6">
                      <Barcode className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{p.barcode}</span>
                    </td>

                    <td className="p-4 text-center font-mono focus:outline-none">
                      {p.cost.toFixed(2)} {lang === 'ar' ? settings.currencyAr : settings.currencyEn}
                    </td>

                    <td className="p-4 text-center font-mono font-semibold" style={{ color: settings.primaryColor }}>
                      {p.price.toFixed(2)} {lang === 'ar' ? settings.currencyAr : settings.currencyEn}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onUpdateInventoryQuantity(p.id, -1)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg ${
                          isUnderStocked 
                            ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 animate-pulse border border-red-200" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200"
                        }`}>
                          {p.quantity} {lang === 'ar' ? "وحدات" : "units"}
                        </span>
                        <button
                          onClick={() => onUpdateInventoryQuantity(p.id, 1)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center font-mono text-slate-400">
                      {p.minQuantity}
                    </td>

                    <td className="p-2 text-center">
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-rose-500 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash className="w-4 h-4 mx-auto" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <PackageMinus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-xs font-mono">
                {lang === 'ar' ? "لم نعثر على سلع مطابقة في المخزون." : "No matching inventory records found."}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add custom creations Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProduct}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4 animate-fade-in text-xs font-medium text-slate-800 dark:text-slate-100"
          >
            <h3 className="text-sm font-bold pb-2 border-b border-slate-100 dark:border-slate-800">
              ☕ {lang === 'ar' ? "إشهار وإنشاء منتج في المحل" : "Add Specialty / Baked Item"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label>{lang === 'ar' ? "الاسم العربي للمنتج" : "Product Arabic Name"}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. كابتشينو دوبل"
                  value={newArName}
                  onChange={(e) => setNewArName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "الاسم الإنجليزي للمنتج" : "Product English Name"}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Double Cappuccino"
                  value={newEnName}
                  onChange={(e) => setNewEnName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "سعر بيع الزبون" : "Customer Price"}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "تكلفة الشراء بالجملة" : "Wholesale Cost"}</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "رصيد المستودع الحالي" : "Initial Stock Quantity"}</label>
                <input
                  type="number"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "عتبة إنذار النقص والنفاد" : "Low Stock Alert Threshold"}</label>
                <input
                  type="number"
                  value={newMinQty}
                  onChange={(e) => setNewMinQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "رمز الباركود اليدوي" : "Custom Barcode (Optional)"}</label>
                <input
                  type="text"
                  placeholder="e.g. 6281002003"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label>{lang === 'ar' ? "التصنيف الرئيسي" : "Assigned Category"}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {lang === 'ar' ? c.labelAr : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {lang === 'ar' ? "إلغاء الأمر" : "Dismiss"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white rounded-lg transition shadow-xs cursor-pointer"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {lang === 'ar' ? "تأبيد وحفظ السلعة" : "Establish Product"}
              </button>
            </div>
          </form>
          </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-5 animate-fade-in text-xs font-medium text-slate-800 dark:text-slate-100">
            <h3 className="text-sm font-bold pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span>🏷️ {lang === 'ar' ? "إدارة أقسام وتصنيفات المنتجات" : "Manage Product Categories"}</span>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                ✕
              </button>
            </h3>

            {/* Existing Categories List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-500">
                {lang === 'ar' ? "الأقسام والجروبات الحالية" : "Current Active Sections"}
              </h4>
              <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {categories.length === 0 ? (
                  <p className="p-4 text-center text-slate-400">
                    {lang === 'ar' ? "لا يوجد أقسام مضافة حالياً." : "No categories configured yet."}
                  </p>
                ) : (
                  categories.map((c) => (
                    <div key={c.key} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{c.labelAr}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.labelEn} (key: {c.key})</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(lang === 'ar' ? `هل أنت متأكد من حذف قسم "${c.labelAr}"؟\nسيتم حذف القسم فقط، وسيتعين إعادة تصنيف منتجات هذا القسم.` : `Are you sure you want to delete category "${c.labelEn}"?`)) {
                            onDeleteCategory(c.key);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                        title={lang === "ar" ? "حذف القسم" : "Delete category"}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Category Action Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatLabelAr.trim() || !newCatLabelEn.trim()) return;
                const key = "cat_" + Date.now();
                onAddCategory({
                  key,
                  labelAr: newCatLabelAr.trim(),
                  labelEn: newCatLabelEn.trim()
                });
                setNewCatLabelAr("");
                setNewCatLabelEn("");
              }}
              className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-3 border border-slate-105/40 dark:border-slate-800"
            >
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? "إضافة قسم جديد للمشروبات أو المأكولات" : "Add New Category Block"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500">{lang === 'ar' ? "اسم القسم (عربي)" : "Name (Arabic)"}</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: وافل وكريب"
                    value={newCatLabelAr}
                    onChange={(e) => setNewCatLabelAr(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500">{lang === 'ar' ? "اسم القسم (إنجليزي)" : "Name (English)"}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Waffles & Crepes"
                    value={newCatLabelEn}
                    onChange={(e) => setNewCatLabelEn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {lang === 'ar' ? "تأكيد إضافة القسم" : "Confirm Category Addition"}
              </button>
            </form>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                {lang === 'ar' ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
