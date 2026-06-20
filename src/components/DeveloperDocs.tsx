/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Code2, Terminal, Copy, Check, FileCode, CheckCheck, Link } from "lucide-react";

interface DeveloperDocsProps {
  lang: 'ar' | 'en';
}

export default function DeveloperDocs({ lang }: DeveloperDocsProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const codeSnippets = {
    checkout: `/**
 * Core function inside cashier process stream.
 * Computes VAT, pushes transaction to historical array,
 * decrement associated inventory items & triggers print.
 */
interface CheckoutPayload {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'deferred';
}

export async function processCheckout(payload: CheckoutPayload) {
  const salesTax = 0.15; // 15% Standard VAT
  let subtotal = 0;
  
  // 1. Calculate prices
  for (const item of payload.items) {
    const product = inventory.find(p => p.id === item.productId);
    if (!product) throw new Error("Product not in inventory.");
    if (product.quantity < item.quantity) {
      alertLowStockNotice(product.nameAr);
    }
    subtotal += product.price * item.quantity;
  }
  
  const tax = subtotal * salesTax;
  const total = subtotal + tax;
  
  // 2. Decrement quantities and sync
  const updatedInventory = inventory.map(p => {
    const orderItem = payload.items.find(i => i.productId === p.id);
    return orderItem ? { ...p, quantity: p.quantity - orderItem.quantity } : p;
  });
  
  return { subtotal, tax, total, updatedInventory };
}`,
    barcode: `/**
 * Configures the window-level barcode keyboard wedge listener.
 * Captures numeric streams terminated by "Enter" and adds items.
 */
useEffect(() => {
  let barcodeBuffer = "";
  let lastTimestamp = Date.now();

  const handleKeyDown = (e: KeyboardEvent) => {
    const now = Date.now();
    // Heavy speed filters ensure keyboard typings don't count as barcode scanners
    if (now - lastTimestamp > 80) {
      barcodeBuffer = "";
    }
    lastTimestamp = now;

    if (e.key === "Enter") {
      if (barcodeBuffer.length >= 6) {
        dispatchBarcodeTrigger(barcodeBuffer);
        barcodeBuffer = "";
      }
    } else if (/^[0-9]$/.test(e.key)) {
      barcodeBuffer += e.key;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);`
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-850 dark:from-slate-950 dark:to-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold font-mono">
              {lang === "ar" ? "حزمة أدوات المطورين والربط التقني (API)" : "Developer Toolkit & POS APIs"}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {lang === "ar" 
              ? "توثيق برمجية النظام لربطه مع المنصات الخارجية، طابعات الإيصالات الحرارية، أجهزة الباركود، وبث الفواتير والتحليلات سحابياً وبشكل مشفر تماماً." 
              : "Advanced documentation detailing system routines, barcode wedge configurations, thermal receipt structures, and encrypted data backups."}
          </p>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
          v1.4.2 stable
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Functions List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1">
            {lang === "ar" ? "قائمة الدوال البرمجية للدراسة" : "Core Operational Routines"}
          </h3>
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-start gap-2.5">
              <span className="text-xs font-mono bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded">
                Fn 1
              </span>
              <div>
                <b className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                  processCheckout()
                </b>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {lang === 'ar' ? "تأبيد عملية الشراء، حساب الضريبة وخصم الكميات حرارياً." : "Processes and saves cash checkout metadata."}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-start gap-2.5">
              <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                Fn 2
              </span>
              <div>
                <b className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                  generateInvoiceQRCode()
                </b>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {lang === 'ar' ? "تحويل تفاصيل الفاتورة لتشفير البراكود QR المتلائم مع الفاتورة الإلكترونية." : "Generates standard Saudi Fatoora compatible QR codes."}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-start gap-2.5">
              <span className="text-xs font-mono bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                Fn 3
              </span>
              <div>
                <b className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                  window.printReceipt()
                </b>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {lang === 'ar' ? "أوامر الطباعة المباشرة على المقاس الحراري 80mm." : "Sends layout elements directly to thermal printer formats."}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-start gap-2.5">
              <span className="text-xs font-mono bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded">
                Fn 4
              </span>
              <div>
                <b className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 block">
                  backupVault()
                </b>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {lang === 'ar' ? "توليد ملف النسخة الاحتياطية المشفر ذو صيغة CAFE-CIPHER." : "Creates secure custom encrypted system state archives."}
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1">
            {lang === "ar" ? "عناوين الاتصال الخارجية (REST APIs)" : "External REST Endpoints"}
          </h3>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span>
              <span className="text-slate-700 dark:text-slate-300">/api/gemini/chatbot</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span>
              <span className="text-slate-700 dark:text-slate-300">/api/gemini/forecast</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span>
              <span className="text-slate-700 dark:text-slate-300">/api/backup/upload</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded">
              <span className="text-blue-600 dark:text-blue-400 font-bold">GET</span>
              <span className="text-slate-700 dark:text-slate-300">/api/backup/download</span>
            </div>
          </div>

        </div>

        {/* Code Snippets Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 dark:bg-black rounded-xl overflow-hidden border border-slate-800 shadow-lg flex flex-col h-[520px]">
            <div className="p-3.5 bg-slate-850 dark:bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-300 text-left">
                  pos-system-core.ts
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(codeSnippets.checkout, "checkout")}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded flex items-center gap-1.5 text-[11px] transition font-mono"
              >
                {copied === "checkout" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === "checkout" ? (lang === "ar" ? "نسخ!" : "Copied!") : (lang === "ar" ? "نسخ" : "Copy")}</span>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-[11px] text-slate-300 leading-relaxed text-left" style={{ direction: "ltr" }}>
              <pre>{codeSnippets.checkout}</pre>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black rounded-xl overflow-hidden border border-slate-800 shadow-lg flex flex-col h-[400px]">
            <div className="p-3.5 bg-slate-850 dark:bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-300 text-left">
                  barcode-scanner-wedge.ts
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(codeSnippets.barcode, "barcode")}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded flex items-center gap-1.5 text-[11px] transition font-mono"
              >
                {copied === "barcode" ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === "barcode" ? (lang === "ar" ? "نسخ!" : "Copied!") : (lang === "ar" ? "نسخ" : "Copy")}</span>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-[11px] text-slate-300 leading-relaxed text-left" style={{ direction: "ltr" }}>
              <pre>{codeSnippets.barcode}</pre>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
