/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Smartphone, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Users, Award } from "lucide-react";
import { Order, Product } from "../types";
import { formatCurrency } from "../utils";

interface MobileAppViewProps {
  lang: 'ar' | 'en';
  orders: Order[];
  inventory: Product[];
  settings: any;
}

export default function MobileAppView({ lang, orders, inventory, settings }: MobileAppViewProps) {
  // Compute key stats for remote owner mobile view
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTransactions = orders.length;
  const lowStockItems = inventory.filter(p => p.quantity <= p.minQuantity);
  const currencySymbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;

  // Find most popular products
  const productSalecounts: { [key: string]: { nameAr: string, nameEn: string, count: number } } = {};
  orders.forEach(o => {
    o.items.forEach(itm => {
      if (!productSalecounts[itm.product.id]) {
        productSalecounts[itm.product.id] = {
          nameAr: itm.product.nameAr,
          nameEn: itm.product.nameEn,
          count: 0
        };
      }
      productSalecounts[itm.product.id].count += itm.quantity;
    });
  });

  const bestSeller = Object.values(productSalecounts).sort((a,b) => b.count - a.count)[0];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Device frame container */}
      <div className="relative w-[340px] h-[680px] bg-slate-900 dark:bg-black rounded-[48px] p-4 shadow-2xl border-4 border-slate-700 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Device Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-[22px] w-[140px] bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
          <div className="absolute right-6 w-1.5 h-1.5 bg-indigo-900/40 rounded-full"></div>
        </div>

        {/* Device screen content */}
        <div className="flex-1 rounded-[38px] bg-slate-50 dark:bg-slate-950 overflow-y-auto px-4 pt-6 pb-2 relative flex flex-col text-slate-800 dark:text-slate-100">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between mt-1 mb-4">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {lang === 'ar' ? "لوحة المالك عن بُعد" : "Remote Owner Panel"}
              </span>
              <h4 className="text-xs font-bold font-mono tracking-wide">
                ☕ {lang === 'ar' ? settings.nameAr : settings.nameEn}
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                {lang === 'ar' ? "مباشر" : "Live"}
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="space-y-3">
            
            {/* Total sales badge */}
            <div className="p-3.5 text-white rounded-2xl shadow-xs relative overflow-hidden" style={{ backgroundColor: settings.primaryColor }}>
              <div className="absolute -right-3 -bottom-3 opacity-15">
                <Smartphone className="w-24 h-24 rotate-12" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/80 font-medium">
                {lang === 'ar' ? "إجمالي المبيعات اليومية" : "Total Daily Sales"}
              </span>
              <p className="text-xl font-black font-mono mt-1">
                {formatCurrency(totalSales, currencySymbol, lang)}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[9px] text-white bg-white/20 px-2 py-0.5 rounded-lg w-max">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% {lang === 'ar' ? "مقارنة بالأمس" : "vs yesterday"}</span>
              </div>
            </div>

            {/* Quick grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between shadow-xs">
                <span className="text-[10px] text-slate-400 block font-sans">
                  {lang === 'ar' ? "الطلبات" : "Orders"}
                </span>
                <p className="text-sm font-bold font-mono" style={{ color: settings.primaryColor }}>
                  {totalTransactions}
                </p>
                <span className="text-[8px] text-slate-400 mt-1 font-sans">
                  {lang === 'ar' ? "تمت بنجاح" : "Completed OK"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-slate-400 block">
                  {lang === 'ar' ? "باريستا الخدمة" : "Staff Active"}
                </span>
                <p className="text-sm font-bold flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  <span>2</span>
                </p>
                <span className="text-[8px] text-emerald-500 font-medium">
                  {lang === 'ar' ? "مناوبة الصباح" : "Morning Shift"}
                </span>
              </div>
            </div>

            {/* Best Seller Mobile Alert */}
            {bestSeller && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/60 rounded-xl flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">
                    {lang === 'ar' ? "الأكثر مبيعاً" : "BEST SELLING"}
                  </span>
                  <span className="text-[11px] font-bold block leading-none">
                    {lang === 'ar' ? bestSeller.nameAr : bestSeller.nameEn}
                  </span>
                  <span className="text-[9px] text-teal-600 dark:text-teal-400 font-mono mt-0.5 block">
                    {lang === 'ar' ? `مباع ${bestSeller.count} أكواب` : `${bestSeller.count} units sold`}
                  </span>
                </div>
              </div>
            )}

            {/* Low stock indicators on Mobile */}
            <div className="space-y-1.5 h-[180px] overflow-y-auto">
              <span className="text-[10px] font-bold block text-slate-400">
                ⚠️ {lang === 'ar' ? "إنذارات المخزون المتدني" : "Low Stock Alerts"} ({lowStockItems.length})
              </span>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-xl border border-dotted border-slate-200">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ✅ {lang === 'ar' ? "المخزون ممتاز!" : "All stock checks OK!"}
                  </span>
                </div>
              ) : (
                lowStockItems.map(p => (
                  <div key={p.id} className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/60 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block truncate max-w-[140px]">
                        {lang === 'ar' ? p.nameAr : p.nameEn}
                      </span>
                      <span className="text-[9px] text-red-500 font-mono">
                        {lang === 'ar' ? `المتبقي: ${p.quantity} وحدات` : `Stock remains: ${p.quantity}`}
                      </span>
                    </div>
                    <span className="text-[9px] bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-mono">
                      {lang === 'ar' ? "اتخذ جراء" : "Urgent"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Recent Orders Stream */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold block text-slate-400">
                🔄 {lang === 'ar' ? "البث المباشر للعمليات" : "Live Stream Activity"}
              </span>
              <div className="space-y-1 text-xs">
                {orders.slice(-3).reverse().map((o, idx) => (
                  <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[10px] block font-mono text-slate-600 dark:text-slate-300">
                        {o.invoiceNumber}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {o.paymentMethod.toUpperCase()} • {o.items.length} {lang === 'ar' ? "عناصر" : "items"}
                      </span>
                    </div>
                    <span className="text-[11px] font-black font-mono text-emerald-600 text-right">
                      +{formatCurrency(o.total, currencySymbol, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom navigation bar */}
          <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-around text-slate-400">
            <button className="flex flex-col items-center gap-0.5" style={{ color: settings.primaryColor }}>
              <span className="text-[8px] uppercase tracking-tight">{lang === 'ar' ? "الرئيسية" : "Home"}</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 hover:text-slate-700">
              <span className="text-[8px] uppercase tracking-tight">{lang === 'ar' ? "المخزون" : "Stock"}</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 hover:text-slate-700">
              <span className="text-[8px] uppercase tracking-tight">{lang === 'ar' ? "الإعدادات" : "Settings"}</span>
            </button>
          </div>

        </div>
        {/* Device Home Indicator Bar */}
        <div className="w-32 h-1 bg-slate-700 dark:bg-slate-800 rounded-full mx-auto mt-2 z-25"></div>
      </div>
    </div>
  );
}
