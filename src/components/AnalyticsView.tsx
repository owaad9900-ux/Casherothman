/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TrendingUp, Sparkles, Download, Printer, Percent, DollarSign, BarChart3, AlertCircle, RefreshCw } from "lucide-react";
import { Order, Product, ForecastResult } from "../types";
import { formatCurrency, exportToCSV } from "../utils";

interface AnalyticsViewProps {
  lang: 'ar' | 'en';
  orders: Order[];
  inventory: Product[];
  settings: any;
  isOnline: boolean;
}

export default function AnalyticsView({ lang, orders, inventory, settings, isOnline }: AnalyticsViewProps) {
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  
  // 1. Calculate General KPI Metrics
  const currencySymbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;
  const totalIncome = orders.reduce((sum, o) => sum + o.total, 0);
  
  // Total cost representation
  let totalCost = 0;
  orders.forEach(o => {
    o.items.forEach(itm => {
      totalCost += (itm.product.cost * itm.quantity);
    });
  });

  const grossProfit = totalIncome - totalCost;
  const profitMarginPercent = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
  const avgOrderValue = orders.length > 0 ? totalIncome / orders.length : 0;

  // 2. Aggregate sales per product category
  const categorySales: { [key: string]: { nameAr: string; nameEn: string; total: number; count: number } } = {
    "drinks-hot": { nameAr: "مشروبات ساخنة", nameEn: "Hot Drinks", total: 0, count: 0 },
    "drinks-cold": { nameAr: "مشروبات مثلجة", nameEn: "Cold Breweries", total: 0, count: 0 },
    "food": { nameAr: "حلويات ومأكولات", nameEn: "Bakery & Food", total: 0, count: 0 },
    "retail": { nameAr: "علب بن وأدوات", nameEn: "Retail Coffee Beans", total: 0, count: 0 },
  };

  orders.forEach(o => {
    o.items.forEach(itm => {
      const cat = itm.product.category;
      if (categorySales[cat]) {
        categorySales[cat].total += itm.product.price * itm.quantity;
        categorySales[cat].count += itm.quantity;
      }
    });
  });

  // 3. Automated AI forecasting trigger via Gemini API
  const handleTriggerAIForecast = async () => {
    setForecasting(true);
    try {
      // package dynamic history to post to API
      const streamlinedSales = orders.map(o => ({
        total: o.total,
        date: o.date,
        items: o.items.map(i => ({ nameEn: i.product.nameEn, qty: i.quantity }))
      }));

      const streamlinedInventory = inventory.map(i => ({
        nameEn: i.nameEn,
        stock: i.quantity,
        limit: i.minQuantity
      }));

      const res = await fetch("/api/gemini/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesHistory: streamlinedSales,
          inventory: streamlinedInventory,
          lang
        })
      });

      const data = await res.json();
      setForecastResult(data);
    } catch (e) {
      console.error("AI Forecasting error", e);
    } finally {
      setForecasting(false);
    }
  };

  // 4. Export Table metrics to Excel (CSV syntax)
  const handleExportExcel = () => {
    const headers = lang === 'ar' 
      ? ["رقم الفاتورة", "التاريخ", "العميل", "طريقة الدفع", "المجموع"] 
      : ["Invoice ID", "Date", "Customer", "Payment Method", "Grand Total"];
      
    const rows = orders.map(o => [
      o.invoiceNumber,
      new Date(o.date).toLocaleDateString(),
      o.customerName || "-",
      o.paymentMethod.toUpperCase(),
      o.total.toFixed(2)
    ]);

    exportToCSV(`cafe_sales_report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // Trigger default print layout
  const handlePrintReport = () => {
    window.print();
  };

  const chartData = Object.entries(categorySales).map(([key, value]) => ({
    label: lang === 'ar' ? value.nameAr : value.nameEn,
    total: value.total,
    count: value.count
  }));

  const maxChartValue = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      
      {/* Header bar and exporting actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-wide">
            📊 {lang === 'ar' ? "لوحة التقارير والتحليلات اللحظية" : "Real-time Audits & Dashboard"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ar' ? "إجمالي الأرباح، نسبة الفواقد، تتبع مبيعات الباريستا، والتكهن بمعدل الطلب." : "Monitor costs, profit multipliers, cashier streams, and predictive demands."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'ar' ? "تصدير إلى Excel (CSV)" : "Export to Excel"}</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? "طباعة الفاتورة اليومية" : "Print Report PDF"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Income */}
        <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-xs text-gray-400 block">{lang === 'ar' ? "إجمالي مبيعات اليوم" : "Total Gross Income"}</span>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              {formatCurrency(totalIncome, currencySymbol, lang)}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${settings.primaryColor}14`, color: settings.primaryColor }}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Cost */}
        <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-xs text-gray-400 block">{lang === 'ar' ? "تكلفة المخازن والتشغيل" : "Wholesale Cost"}</span>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              {formatCurrency(totalCost, currencySymbol, lang)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-900 text-gray-500 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* Clear Margin Net profit */}
        <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-xs text-gray-400 block">{lang === 'ar' ? "صافي الربح الفعلي" : "Net Profit Margin"}</span>
            <p className="text-xl font-bold font-mono" style={{ color: settings.primaryColor }}>
              {formatCurrency(grossProfit, currencySymbol, lang)}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${settings.primaryColor}14`, color: settings.primaryColor }}>
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Ticket Average size */}
        <div className="p-5 bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-slate-800/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-right">
            <span className="text-xs text-gray-400 block">{lang === 'ar' ? "متوسط قيمة الطلبات" : "Avg Ticket Size"}</span>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              {formatCurrency(avgOrderValue, currencySymbol, lang)}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Sales Charts Category view */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              📈 {lang === 'ar' ? "إحصائيات المبيعات حسب الصنف" : "Sales Performance by Category"}
            </h3>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-300 px-2 py-1 rounded">
              {lang === 'ar' ? "نقدي وبطاقة" : "All Sales"}
            </span>
          </div>

          {/* SVG representation chart */}
          <div className="py-6 flex flex-col justify-center space-y-4">
            {chartData.map((d, index) => {
              const barWidthPercent = Math.min((d.total / maxChartValue) * 100, 100);
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(d.total, currencySymbol, lang)} <span className="text-slate-400">({d.count} u)</span>
                    </span>
                  </div>
                  {/* Progress track */}
                  <div className="w-full h-3 bg-gray-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${barWidthPercent > 0 ? barWidthPercent : 2}%`,
                        backgroundColor: settings.primaryColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex gap-3 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>● <b>{lang === 'ar' ? "إجمالي التوزيع" : "Distribution"}</b>: {lang === 'ar' ? "الرسم يحصي مبيعات القيمة وتعداد وحدات سحب الكرت." : "Total income with total physical units sold."}</span>
          </div>
        </div>

        {/* AI smart trends analytics forecasting */}
        <div className="lg:col-span-1 bg-gradient-to-b from-gray-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-850 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {lang === 'ar' ? "تحليل باريستا للتنبؤ الذكي" : "Barista AI demand forecast"}
                </h3>
              </div>
              <span className="text-[9px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black font-mono">GEMINI</span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {lang === 'ar' 
                ? "يحلل خادم الذكاء الاصطناعي مبيعاتك اليومية وموازين المخزون للتنبؤ بمعدل الأرباح المستقبلية ومعدلات النقص." 
                : "Gemini artificial intelligence engine reviews your sales logs and ingredient stocks to predict low stock alerts and next week's counts."}
            </p>

            {forecastResult ? (
              <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10 animate-fade-in text-xs leading-normal">
                <div>
                  <span className="text-[10px] text-yellow-300 block uppercase font-mono font-bold">
                    {lang === 'ar' ? "توقع مبيعات الأسبوع القادم" : "EXPECTED CUPS NEXT 7 DAYS"}
                  </span>
                  <span className="text-lg font-black font-mono">
                    ~ {forecastResult.nextWeekEstimate} {lang === 'ar' ? "كوب قهوة" : "Units"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-yellow-300 block uppercase font-mono font-bold">
                    {lang === 'ar' ? "الصنف الأكثر طلباً قادماً" : "BIGGEST PENDING WAVE"}
                  </span>
                  <span className="font-bold text-slate-100">
                    {forecastResult.bestSellingCategory}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-yellow-300 block uppercase font-mono font-bold">
                    {lang === 'ar' ? "مواد يُنصح بتوفيرها فوراً" : "ITEMS RECOMMENDED TO ENLARGE STOCK"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[9px] text-teal-200">
                    {forecastResult.demandedItems.map((item, id) => (
                      <span key={id} className="bg-white/10 px-2 py-0.5 rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-2.5 text-slate-300">
                  <p className="text-[10px] leading-relaxed">
                    {lang === 'ar' ? forecastResult.trendAnalysisAr : forecastResult.trendAnalysisEn}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-6 h-6 text-indigo-400" />
                <span className="text-xs text-slate-300 font-mono">
                  {lang === 'ar' ? "تحتاج لتنشيط التكهن" : "Predictor is dormant"}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              onClick={handleTriggerAIForecast}
              disabled={forecasting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 text-slate-950 font-bold rounded-xl hover:bg-yellow-500 transition disabled:opacity-50 text-xs shadow"
            >
              <RefreshCw className={`w-4 h-4 ${forecasting ? "animate-spin" : ""}`} />
              <span>
                {forecasting 
                  ? (lang === 'ar' ? "جاري الاستقصاء عبر الذكاء الاصطناعي..." : "Querying AI Analysis...") 
                  : (lang === 'ar' ? "تحديث التوقع الذكي بالذكاء الاصطناعي" : "Re-calculate AI Forecasting")}
              </span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
