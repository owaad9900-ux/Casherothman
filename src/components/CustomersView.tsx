import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Trash2, 
  UserPlus, 
  Star, 
  Calendar,
  DollarSign,
  Award,
  Clock,
  ChevronRight
} from "lucide-react";
import { Customer, CafeSettings } from "../types";
import { formatCurrency } from "../utils";

interface CustomersViewProps {
  lang: 'ar' | 'en';
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  settings: CafeSettings;
}

export default function CustomersView({
  lang,
  customers,
  setCustomers,
  settings
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  
  const currencySymbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;

  // Filter customers by search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  // Handle manual customer creation
  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim() || "-",
      totalSpent: 0,
      ordersCount: 0,
      lastVisit: new Date().toISOString()
    };

    setCustomers(prev => [newCust, ...prev]);
    setShowAddModal(false);
    setNewName("");
    setNewPhone("");
  };

  // Delete customer
  const handleDeleteCustomer = (id: string) => {
    if (window.confirm(lang === 'ar' ? "هل أنت متأكد من حذف هذا العميل؟" : "Are you sure you want to delete this customer?")) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  // Get total stats
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const topCustomer = customers.length > 0 
    ? [...customers].sort((a,b) => b.totalSpent - a.totalSpent)[0] 
    : null;

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-[100vh]">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-500" style={{ color: settings.primaryColor }} />
            <span>{lang === "ar" ? "قسم إدارة العملاء" : "Clients & CRM Desk"}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {lang === "ar" 
              ? "قاعدة بيانات عملاء المقهى المسجلة مبيعاتهم من شاشة الكاشير لمراقبه الزوار الدائمين وإدارة الولاء." 
              : "Cafe customers database collected during cashier sales for analytics, tracking, and loyalty reward programs."
            }
          </p>
        </div>

        <button
          onClick={() => {
            setNewName("");
            setNewPhone("");
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition hover:opacity-90 self-start md:self-auto cursor-pointer"
          style={{ backgroundColor: settings.primaryColor }}
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>{lang === "ar" ? "تسجيل عميل جديد" : "Register Custom Client"}</span>
        </button>
      </div>

      {/* CRM Dashboard widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        {/* Total Customers */}
        <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-[0_2px_12px_-5px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              {lang === "ar" ? "إجمالي العملاء المسجلين" : "Total Registered Clients"}
            </span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1.5 block font-mono">
              {customers.length}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-2xl">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total CRM Sales */}
        <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-[0_2px_12px_-5px_rgba(0,0,0,0.04)]">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              {lang === "ar" ? "مبيعات العملاء المسجلين" : "Client Base Revenue"}
            </span>
            <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1.5 block font-mono">
              {formatCurrency(totalSpentAll, currencySymbol, lang)}
            </span>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-500 rounded-2xl">
            <Award className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Top Loyal customer */}
        <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-[0_2px_12px_-5px_rgba(0,0,0,0.04)] sm:col-span-2 lg:col-span-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
              {lang === "ar" ? "العميل الأكثر شراءً (VIP)" : "Top Loyal Customer (VIP)"}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white mt-2 block truncate max-w-[200px]">
              {topCustomer ? topCustomer.name : "-"}
            </span>
            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
              {topCustomer ? `${lang === 'ar' ? 'أنفق' : 'Spent'} ${formatCurrency(topCustomer.totalSpent, currencySymbol, lang)}` : ""}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl">
            <Star className="w-5.5 h-5.5 fill-amber-400" />
          </div>
        </div>

      </div>

      {/* Database Search & List Panel */}
      <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-slate-800/80 rounded-2xl shadow-[0_2px_12px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Search header container */}
        <div className="p-4 bg-gray-50/50 dark:bg-slate-900/10 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={lang === 'ar' ? "ابحث بالاسم أو رقم الجوال..." : "Find client by name or phone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-transparent border-none outline-none text-gray-800 dark:text-gray-100"
            />
          </div>

          <span className="text-[10px] text-gray-400 block font-mono">
            {lang === 'ar' ? `تم العثور على ${filteredCustomers.length} عميل` : `Found ${filteredCustomers.length} client profiles`}
          </span>
        </div>

        {/* Customer Records Table/List layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-gray-400 font-bold bg-gray-50/30 dark:bg-neutral-900/10">
                <th className="p-4 text-right">{lang === 'ar' ? "العميل" : "Client Name"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "رقم الهاتف" : "Telephone / Phone"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "إجمالي الفواتير" : "Orders count"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "مجموع المشتريات" : "Total Spend"}</th>
                <th className="p-4 text-center">{lang === 'ar' ? "آخر زيارة" : "Last Visit"}</th>
                <th className="p-4 text-center w-16">{lang === 'ar' ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-xs">
              {filteredCustomers.map((c) => {
                const isVip = c.totalSpent > 30000;
                return (
                  <tr key={c.id} className="hover:bg-gray-50/45 dark:hover:bg-slate-900/20 transition-colors">
                    
                    {/* Name detail */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold select-none text-[11px]" style={{ backgroundColor: isVip ? '#eab308' : settings.primaryColor }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {c.name}
                          </span>
                          {isVip && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[8px] font-bold mt-1 uppercase font-sans">
                              👑 VIP CUSTOMER
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone detail */}
                    <td className="p-4 text-center font-mono text-gray-600 dark:text-slate-300">
                      <div className="flex items-center justify-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>

                    {/* Orders count */}
                    <td className="p-4 text-center font-mono text-gray-600 dark:text-slate-300">
                      <span className="px-2 py-1 bg-gray-50 dark:bg-slate-950/40 rounded-lg text-[11px] font-bold">
                        {c.ordersCount}
                      </span>
                    </td>

                    {/* Total spend */}
                    <td className="p-4 text-center font-mono font-bold text-emerald-655 dark:text-emerald-450 text-[13px]">
                      {formatCurrency(c.totalSpent, currencySymbol, lang)}
                    </td>

                    {/* Last visit */}
                    <td className="p-4 text-center text-gray-400 text-[10px]">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span>{new Date(c.lastVisit).toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Actions delete */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title={lang === 'ar' ? "حذف الملف" : "Delete Client Profile"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 font-sans">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
                    <p className="text-[11px]">
                      {lang === 'ar' ? "لا توجد سجلات مطابقة لعملاء المقهى." : "No matching customer records found."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Manual Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 animate-fade-in text-xs font-semibold text-slate-800 dark:text-slate-100">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-150 dark:border-slate-800 mb-4">
              <h3 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-sans">
                <UserPlus className="w-4.5 h-4.5 text-emerald-500" />
                <span>{lang === 'ar' ? "تسجيل عميل جديد يدوياً" : "Register New Client Manual"}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewCustomer} className="space-y-4 text-right">
              
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                  {lang === 'ar' ? "اسم العميل / العميلة" : "Client Full Name"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? "اسم العميل الثلاثي..." : "e.g., Khalid Ahmad"}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 dark:text-gray-100 transition"
                  dir="auto"
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">
                  {lang === 'ar' ? "رقم جوال العميل" : "Phone Number (Mobile)"}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? "مثال: 0770xxxxxxx" : "e.g., 07701234567"}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-3 text-xs bg-gray-50 dark:bg-slate-950/40 border border-gray-150 dark:border-slate-800 rounded-xl outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800 dark:text-gray-100 transition font-mono"
                  dir="ltr"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {lang === 'ar' ? "إلغاء وتراجع" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white text-xs font-bold rounded-xl transition hover:opacity-90 cursor-pointer shadow-xs"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {lang === 'ar' ? "تأكيد التسجيل" : "Confirm Register"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
