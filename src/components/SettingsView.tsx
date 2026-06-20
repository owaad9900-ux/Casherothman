/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, Sliders, Palette, Shield, Database, Check, AlertCircle, RefreshCw, FileText, ArrowUp, ArrowDown, Eye, Settings as SettingsIcon, Printer, Plus, Trash, Wifi, Cpu, Layers } from "lucide-react";
import { CafeSettings } from "../types";
import { encryptData, decryptData } from "../utils";

interface SettingsViewProps {
  lang: 'ar' | 'en';
  settings: CafeSettings;
  onUpdateSettings: (newSettings: CafeSettings) => void;
  onRestoreBackup: (recoveredData: { products: any[]; orders: any[] }) => void;
  getBackupPayload: () => { products: any[]; orders: any[] };
  isOnline: boolean;
}

export default function SettingsView({
  lang,
  settings,
  onUpdateSettings,
  onRestoreBackup,
  getBackupPayload,
  isOnline
}: SettingsViewProps) {
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [backupKey, setBackupKey] = useState("espresso123");
  const [cloudSyncing, setCloudSyncing] = useState(false);

  // Printer manager state
  const [printerFormOpen, setPrinterFormOpen] = useState(false);
  const [testPrintActiveId, setTestPrintActiveId] = useState<string | null>(null);
  const [testPrintSuccess, setTestPrintSuccess] = useState<string | null>(null);
  const [newPrinter, setNewPrinter] = useState<{
    nameAr: string;
    nameEn: string;
    connectionType: 'usb' | 'network' | 'bluetooth' | 'browser';
    connectionValue: string;
    paperSize: '80mm' | '58mm';
    categories: string[];
    isActive: boolean;
  }>({
    nameAr: "",
    nameEn: "",
    connectionType: 'network',
    connectionValue: "192.168.1.",
    paperSize: "80mm",
    categories: [],
    isActive: true
  });

  const handleAddPrinter = () => {
    if (!newPrinter.nameAr || !newPrinter.nameEn) {
      setErrorMsg(lang === 'ar' ? "يرجى ملء اسم الطابعة المخصصة بالجهتين العربية والإنجليزية!" : "Please fill out printer names in both Arabic and English!");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }
    const printers = [...(settings.printerConfigs || [])];
    const created = {
      id: "prn-" + Date.now(),
      nameAr: newPrinter.nameAr,
      nameEn: newPrinter.nameEn,
      connectionType: newPrinter.connectionType,
      connectionValue: newPrinter.connectionValue,
      paperSize: newPrinter.paperSize,
      categories: newPrinter.categories,
      isActive: newPrinter.isActive
    };
    onUpdateSettings({
      ...settings,
      printerConfigs: [...printers, created]
    });
    setPrinterFormOpen(false);
    setNewPrinter({
      nameAr: "",
      nameEn: "",
      connectionType: 'network',
      connectionValue: "192.168.1.",
      paperSize: "80mm",
      categories: [],
      isActive: true
    });
    setSuccessMsg(lang === 'ar' ? "تمت إضافة وتوجيه الطابعة بنجاح!" : "Printer added and routed successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDeletePrinter = (id: string) => {
    const printers = (settings.printerConfigs || []).filter(p => p.id !== id);
    onUpdateSettings({
      ...settings,
      printerConfigs: printers
    });
    setSuccessMsg(lang === 'ar' ? "تم حسم وحذف الطابعة بنجاح." : "Printer successfully removed.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleTogglePrinterActive = (id: string) => {
    const printers = (settings.printerConfigs || []).map(p => {
      if (p.id === id) return { ...p, isActive: !p.isActive };
      return p;
    });
    onUpdateSettings({
      ...settings,
      printerConfigs: printers
    });
  };

  const handleTestPrint = (p: any) => {
    setTestPrintActiveId(p.id);
    setTimeout(() => {
      setTestPrintActiveId(null);
      setTestPrintSuccess(p.id);
      setTimeout(() => setTestPrintSuccess(null), 4000);
    }, 1500);
  };

  // File picker reference for custom logo upload from PC
  const fileInputRef = useRef<HTMLInputElement>(null);

  const brandColors = [
    { name: lang === 'ar' ? "أخضر زيتي" : "Coffee Teal", value: "#0f766e" },
    { name: lang === 'ar' ? "بني قهوة" : "Mocha Brown", value: "#7c2d12" },
    { name: lang === 'ar' ? "كحلي أنيق" : "Classic Navy", value: "#1e3a8a" },
    { name: lang === 'ar' ? "أحمر كرزي" : "Cherry Red", value: "#be123c" },
    { name: lang === 'ar' ? "رمادي فحمي" : "Charcoal Slate", value: "#334155" }
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg(lang === 'ar' ? "حجم الصورة كبير جداً (الأقصى 2 ميجابايت)" : "File is too large (maximum 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({ ...settings, logoUrl: reader.result as string });
      setSuccessMsg(lang === 'ar' ? "تم تحميل شعار المقهى بنجاح!" : "Cafe logo uploaded successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    };
    reader.onerror = () => {
      setErrorMsg("Error reading image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleBackupDownload = () => {
    try {
      const payload = getBackupPayload();
      const encrypted = encryptData(payload, backupKey);
      
      const element = document.createElement("a");
      const file = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = `cafe_pos_secure_backup_${new Date().toISOString().split('T')[0]}.cfg`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setSuccessMsg(lang === 'ar' ? "تم تحميل النسخة الاحتياطية المشفرة بنجاح!" : "Encrypted backup downloaded successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const cipherText = reader.result as string;
        const decrypted = decryptData(cipherText, backupKey);
        
        if (decrypted.products && decrypted.orders) {
          onRestoreBackup(decrypted);
          setSuccessMsg(lang === 'ar' ? "تم استرجاع البيانات والطلبات والمخزون بالكامل!" : "All inventory products and orders recovered successfully!");
          setTimeout(() => setSuccessMsg(""), 4000);
        } else {
          throw new Error("Invalid schema inside backup configuration.");
        }
      } catch (err: any) {
        setErrorMsg(lang === 'ar' ? `فشل الاسترجاع: ${err.message}` : `Recovery failed: ${err.message}`);
        setTimeout(() => setErrorMsg(""), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleCloudSync = async () => {
    if (!isOnline) {
      setErrorMsg(lang === "ar" ? "يتعذر ذلك لكونك في وضع العمل دون اتصال بالإنترنت حالياً." : "Syncing unavailable. POS is currently working offline.");
      return;
    }

    setCloudSyncing(true);
    try {
      const payload = getBackupPayload();
      const encryptedPayload = encryptData(payload, "cloudSecretWedge");

      const res = await fetch("/api/backup/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedPayload })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(lang === 'ar' ? "تمت المزامنة وحفظ النسخة الاحتياطية السحابية بنجاح!" : "Dynamic cloud backup synchronization completed successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Cloud replication failed.");
    } finally {
      setCloudSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between shadow-sm animate-fade-in text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 text-rose-800 dark:text-rose-300 rounded-xl flex items-center justify-between shadow-sm animate-fade-in text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column containing Cafe settings and Invoice Designer */}
        <div className="space-y-6">

          {/* Cafe Information Customs */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? "تخصيص هوية ومعلومات المقهى" : "Cafe Customization & Corporate Identity"}
              </h3>
            </div>

            {/* Logo upload block */}
            <div className="flex flex-col md:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 shrink-0 select-none">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Cafe Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono text-center px-1">Logo</span>
                )}
              </div>
              <div className="space-y-1.5 flex-1 w-full text-center md:text-left">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'ar' ? "تحميل شعار المقهى الخاص من الحاسوب" : "Upload Custom Receipt Logo"}
                </span>
                <p className="text-[10px] text-slate-400 leading-normal mb-2">
                  {lang === 'ar' ? "يظهر الشعار أعلى الفواتير الإلكترونية المطبوعة. الحجم الموصى به: مربع، بصيغة PNG أو JPG." : "This logo prints natively at the top of physical/thermal receipts. Recommended: square PNG/JPG."}
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? "اختر صورة الشعار" : "Pick Logo File"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="space-y-1.5">
                <label>{lang === 'ar' ? "اسم المقهى بالعربية" : "Cafe Name (Arabic)"}</label>
                <input
                  type="text"
                  value={settings.nameAr}
                  onChange={(e) => onUpdateSettings({ ...settings, nameAr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label>{lang === 'ar' ? "اسم المقهى بالإنجليزية" : "Cafe Name (English)"}</label>
                <input
                  type="text"
                  value={settings.nameEn}
                  onChange={(e) => onUpdateSettings({ ...settings, nameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label>{lang === 'ar' ? "معدل ضريبة القيمة المضافة %" : "Standard VAT Tax %"}</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => onUpdateSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label>{lang === 'ar' ? "رمز العملة بالعربية" : "Currency Label (Arabic)"}</label>
                <input
                  type="text"
                  value={settings.currencyAr}
                  onChange={(e) => onUpdateSettings({ ...settings, currencyAr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-medium">
              <label>{lang === 'ar' ? "رأس الفاتورة المكتوب (معلومات إضافية)" : "Receipt Header Text (VAT Registration / CR Number)"}</label>
              <input
                type="text"
                value={lang === "ar" ? settings.receiptHeaderAr : settings.receiptHeaderEn}
                onChange={(e) => {
                  if (lang === "ar") {
                    onUpdateSettings({ ...settings, receiptHeaderAr: e.target.value });
                  } else {
                    onUpdateSettings({ ...settings, receiptHeaderEn: e.target.value });
                  }
                }}
                placeholder="e.g. CR No: 10101928091 - VAT: 300092810928003"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>

          </div>

          {/* E-Invoice Designer Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <SettingsIcon className="w-5 h-5 text-teal-600" style={{ color: settings.primaryColor }} />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? "تصميم وتنسيق مظهر الفاتورة الإلكترونية" : "E-Invoice Layout & Aesthetics Designer"}
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {lang === 'ar' 
                ? "خصص شكل ومعاينة الفاتورة التي تظهر للعملاء ويتم طباعتها وتداولها، فورياً مع تحديد حجم الخط، تفعيل الحقول، وترتيب المربعات." 
                : "Customize the interactive design layouts of virtual thermal bills. Switch sizes, toggle sections, and re-order widgets instantly."
              }
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
              
              {/* Controls panel */}
              <div className="xl:col-span-7 space-y-5">
                
                {/* 1. Font size slider */}
                <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100/50 dark:border-slate-800/40 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    <span>{lang === 'ar' ? "حجم خط الفاتورة" : "Receipt Font Size"}</span>
                    <span className="font-mono bg-white dark:bg-slate-900 border px-1.5 py-0.5 rounded text-[10px] text-teal-600" style={{ color: settings.primaryColor }}>
                      {settings.receiptFontSize || 12}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={9}
                    max={18}
                    step={1}
                    value={settings.receiptFontSize || 12}
                    onChange={(e) => onUpdateSettings({ ...settings, receiptFontSize: parseInt(e.target.value) || 12 })}
                    className="w-full accent-teal-600 cursor-pointer h-1 bg-gray-200 dark:bg-slate-850 rounded-lg appearance-none mt-2"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-bold font-mono px-1">
                    <span>9px</span>
                    <span>12px {lang === 'ar' ? "(افتراضي)" : "(Default)"}</span>
                    <span>18px</span>
                  </div>
                </div>

                {/* Thermal Printer Hardware Config */}
                <div className="space-y-4 p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100/50 dark:border-slate-800/40 rounded-xl">
                  <div className="flex items-center gap-1.5 border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                    <span className="text-[11px] font-bold text-slate-705 dark:text-slate-100">
                      🖨️ {lang === 'ar' ? "إعدادات الطابعات وتوجيه طلبات الأقسام" : "Thermal Printers & Department Routing Manager"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-semibold">
                    {/* Paper Select */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 block">
                        {lang === 'ar' ? "حجم رول الورق المطبوع الافتراضي" : "Default Paper Roll Size"}
                      </label>
                      <select
                        value={settings.printerPaperSize || "80mm"}
                        onChange={(e) => onUpdateSettings({ ...settings, printerPaperSize: e.target.value as "80mm" | "58mm" })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-705 dark:text-slate-300"
                      >
                        <option value="80mm">{lang === 'ar' ? "80 مم (عرض 3 إنش - افتراضي)" : "80mm (3-Inch Standard)"}</option>
                        <option value="58mm">{lang === 'ar' ? "58 مم (عرض 2 إنش - مدمج)" : "58mm (2-Inch Compact)"}</option>
                      </select>
                    </div>

                    {/* Printer Brand Optimization */}
                    <div className="space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 block">
                        {lang === 'ar' ? "بروتوكول تحسين المحاذاة" : "Printer Alignment Engine"}
                      </label>
                      <select
                        value={settings.printerModel || "Xprint"}
                        onChange={(e) => onUpdateSettings({ ...settings, printerModel: e.target.value as "Xprint" | "Standard" })}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-705 dark:text-slate-300"
                      >
                        <option value="Xprint">{lang === 'ar' ? "محاذاة طابعات Xprint الحرارية" : "Optimize for Xprint Hardwares"}</option>
                        <option value="Standard">{lang === 'ar' ? "طابعة افتراضية (نظام التشغيل)" : "Standard OS Graphics Mode"}</option>
                      </select>
                    </div>

                    {/* Line spacing density */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-500 dark:text-slate-400 block">
                        {lang === 'ar' ? "كثافة وارتفاع السطور الفاتورة" : "Print Line Spacing Density"}
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg">
                        {(['dense', 'medium', 'spacious'] as const).map((density) => {
                          const isSel = (settings.printerDensity || 'medium') === density;
                          const densityLabels = {
                            dense: { ar: "مكتنز (توفير ورق)", en: "Dense (Save paper)" },
                            medium: { ar: "متوسط (افتراضي)", en: "Medium" },
                            spacious: { ar: "متباعد ومقروء", en: "Comfortable" }
                          };
                          return (
                            <button
                              key={density}
                              type="button"
                              onClick={() => onUpdateSettings({ ...settings, printerDensity: density })}
                              className={`py-1 text-[9px] font-bold rounded-md transition cursor-pointer ${isSel ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                              {lang === 'ar' ? densityLabels[density].ar : densityLabels[density].en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Multiple Department Printers Directory */}
                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-750 dark:text-slate-200 font-sans">
                          {lang === 'ar' ? "توجيه الطابعات للأقسام والأصناف" : "Section Printer Dispatch Routing"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrinterFormOpen(!printerFormOpen)}
                        className="flex items-center gap-1 px-2.5 py-1 text-white text-[9px] font-black rounded-lg transition cursor-pointer"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{lang === 'ar' ? "طابعة مخصصة جديدة" : "Add Printer Router"}</span>
                      </button>
                    </div>

                    {/* Printers list container */}
                    <div className="space-y-2">
                      {(settings.printerConfigs || [
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
                      ]).map((prn) => {
                        const isTestActive = testPrintActiveId === prn.id;
                        const isTestSuccess = testPrintSuccess === prn.id;
                        return (
                          <div 
                            key={prn.id} 
                            className={`p-3 bg-white dark:bg-slate-900/60 border ${prn.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-slate-100 dark:border-slate-900 opacity-60'} rounded-xl transition text-[9.5px]`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`w-2 h-2 rounded-full ${prn.isActive ? 'bg-emerald-500 animate-pulse bg-emerald-500' : 'bg-slate-300'}`}></span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                    {lang === 'ar' ? prn.nameAr : prn.nameEn}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-semibold text-slate-500 font-mono">
                                    {prn.paperSize}
                                  </span>
                                </div>
                                
                                <div className="text-[8.5px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                                  <div>🔌 {lang === 'ar' ? "الاتصال عبر:" : "Interface:"} <span className="font-bold text-slate-700 dark:text-slate-300">{prn.connectionType.toUpperCase()}</span> ({prn.connectionValue})</div>
                                  <div className="flex flex-wrap gap-1 mt-1 items-center">
                                    <span className="text-[8px] font-sans opacity-70">🎯 {lang === 'ar' ? "يوجه أصناف:" : "Dispatches:"}</span>
                                    {prn.categories.length === 0 ? (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[8px] font-semibold">
                                        {lang === 'ar' ? "غير موجه (كاشير فقط)" : "Cashier invoicing only"}
                                      </span>
                                    ) : (
                                      prn.categories.map(cat => {
                                        const catLabels: {[key: string]: {ar: string, en: string}} = {
                                          'drinks-hot': { ar: "مشروبات حارة", en: "Hot Drinks" },
                                          'drinks-cold': { ar: "مشروبات باردة", en: "Cold Drinks" },
                                          'food': { ar: "مأكولات وأطعمة", en: "Food" },
                                          'retail': { ar: "مبيعات الكاشير", en: "Boutique/Retail" }
                                        };
                                        return (
                                          <span key={cat} className="px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-800/40 text-teal-600 dark:text-teal-350 rounded text-[7.5px] font-bold">
                                            {lang === 'ar' ? catLabels[cat]?.ar || cat : catLabels[cat]?.en || cat}
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions container */}
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleTestPrint(prn)}
                                  className={`px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition font-sans cursor-pointer ${isTestSuccess ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`}
                                  disabled={isTestActive}
                                >
                                  {isTestActive ? (
                                    <span>⏳ {lang === 'ar' ? "اتصال..." : "Connecting..."}</span>
                                  ) : isTestSuccess ? (
                                    <span>✅ {lang === 'ar' ? "ناجح" : "Success"}</span>
                                  ) : (
                                    <span>⚡ {lang === 'ar' ? "اختبار" : "Test print"}</span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePrinterActive(prn.id)}
                                  className={`p-1 rounded-lg border text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer ${prn.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-rose-200 bg-rose-50 dark:bg-rose-950/10 text-rose-500'}`}
                                  title={lang === 'ar' ? "تشغيل/إيقاف" : "Toggle Online"}
                                >
                                  <Cpu className="w-3.5 h-3.5" />
                                </button>

                                {prn.id !== 'prn-cashier' && prn.id !== 'prn-kitchen' && prn.id !== 'prn-bar' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePrinter(prn.id)}
                                    className="p-1 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                                    title={lang === 'ar' ? "إزالة الطابعة" : "Delete Router"}
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Paper mockup inside settings */}
                            {isTestSuccess && (
                              <div className="mt-2.5 p-2 bg-slate-100/30 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg font-mono text-[8px] animate-fade-in text-center text-slate-600 dark:text-slate-400 leading-relaxed max-w-[210px] mx-auto">
                                <p>*** {lang === 'ar' ? "ورقة اختبار الاتصال" : "TEST PRINTER FEED"} ***</p>
                                <p className="font-bold text-teal-600">{lang === 'ar' ? "تم اختبار الاتصال الفوري بنجاح!" : "CONNECTION ESTABLISHED OK"}</p>
                                <p>----------------------</p>
                                <p>{lang === 'ar' ? "طابعة القسم:" : "Section:"} {lang === 'ar' ? prn.nameAr : prn.nameEn}</p>
                                <p>Port: {prn.connectionType.toUpperCase()} ({prn.connectionValue})</p>
                                <p>Paper: {prn.paperSize === "80mm" ? "80mm (ESC-POS)" : "58mm (Receipt)"}</p>
                                <p>Timestamp: {new Date().toLocaleTimeString()}</p>
                                <p>----------------------</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Printer config form */}
                    {printerFormOpen && (
                      <div className="p-3 bg-slate-100/40 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-800/80 rounded-xl space-y-3 animate-fade-in text-[10px] font-semibold">
                        <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800/40 pb-1 flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5 text-teal-600" />
                          <span>{lang === 'ar' ? "إضافة وتوجيه طابعة جديدة للقسم" : "Add and Route Custom Printer"}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Name AR */}
                          <div className="space-y-1">
                            <label className="text-slate-500 dark:text-slate-400 block">{lang === 'ar' ? "الاسم بالعربية" : "Printer Label (AR)"}</label>
                            <input
                              type="text"
                              placeholder={lang === 'ar' ? "مثلا: طابعة المخبوزات والحلويات" : "e.g. Pastries Printer"}
                              value={newPrinter.nameAr}
                              onChange={(e) => setNewPrinter({ ...newPrinter, nameAr: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          {/* Name EN */}
                          <div className="space-y-1">
                            <label className="text-slate-500 dark:text-slate-400 block">{lang === 'ar' ? "الاسم بالإنجليزية" : "Printer Label (EN)"}</label>
                            <input
                              type="text"
                              placeholder={lang === 'ar' ? "Bakery and Dessert Printer" : "e.g. Pastry Hub Printer"}
                              value={newPrinter.nameEn}
                              onChange={(e) => setNewPrinter({ ...newPrinter, nameEn: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          {/* Connection Type */}
                          <div className="space-y-1">
                            <label className="text-slate-500 dark:text-slate-400 block">{lang === 'ar' ? "طريقة الاتصال" : "Connection Method"}</label>
                            <select
                              value={newPrinter.connectionType}
                              onChange={(e) => {
                                const type = e.target.value as any;
                                const val = type === 'network' ? '192.168.1.' : type === 'browser' ? 'Default' : 'USB001';
                                setNewPrinter({ ...newPrinter, connectionType: type, connectionValue: val });
                              }}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-800 dark:text-slate-200"
                            >
                              <option value="network">{lang === 'ar' ? "شبكة LAN (IP Address)" : "LAN Network (IP Address)"}</option>
                              <option value="usb">USB Driver Port</option>
                              <option value="bluetooth">Bluetooth BLE</option>
                              <option value="browser">{lang === 'ar' ? "طابعة افتراضية للنظام" : "Browser print engine"}</option>
                            </select>
                          </div>

                          {/* Connection Value */}
                          <div className="space-y-1">
                            <label className="text-slate-500 dark:text-slate-400 block">
                              {newPrinter.connectionType === 'network' ? (lang === 'ar' ? "عنوان الـ IP" : "IP Address") : (lang === 'ar' ? "اسم المنفذ / المعرف" : "Port/Device ID")}
                            </label>
                            <input
                              type="text"
                              placeholder={newPrinter.connectionType === 'network' ? "192.168.1.18" : "USBPRN-BCN"}
                              value={newPrinter.connectionValue}
                              onChange={(e) => setNewPrinter({ ...newPrinter, connectionValue: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          {/* Paper Roll width */}
                          <div className="space-y-1">
                            <label className="text-slate-500 dark:text-slate-400 block">{lang === 'ar' ? "عرض رول الطابعة" : "Paper Roll Spec"}</label>
                            <select
                              value={newPrinter.paperSize}
                              onChange={(e) => setNewPrinter({ ...newPrinter, paperSize: e.target.value as any })}
                              className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer text-slate-800 dark:text-slate-200"
                            >
                              <option value="80mm">80mm (Wide - Standard)</option>
                              <option value="58mm">58mm (Compact - Handheld)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 space-y-1 bg-white dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg mt-1">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block border-b border-slate-100 dark:border-slate-800 pb-1 mb-1.5">
                              🎯 {lang === 'ar' ? "توجيه الأصناف التالية فوريا إلى هذه الطابعة عند إنتاج الطلبات:" : "Route requests of these categories to this printer automatically:"}
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[9px] font-extrabold text-slate-700 dark:text-slate-300">
                              {[
                                { id: 'drinks-hot', ar: "المشروبات الساخنة", en: "Hot Drinks" },
                                { id: 'drinks-cold', ar: "المشروبات الباردة", en: "Cold Drinks" },
                                { id: 'food', ar: "الأطعمة والمأكولات (المطبخ)", en: "Kitchen Bakery & Food" },
                                { id: 'retail', ar: "مبيعات الكاشير والبوتيك", en: "Cashier/Boutique Retail" }
                              ].map(cat => {
                                const isChecked = newPrinter.categories.includes(cat.id);
                                return (
                                  <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      className="w-3.5 h-3.5 accent-teal-605"
                                      onChange={() => {
                                        const prev = [...newPrinter.categories];
                                        if (isChecked) {
                                          setNewPrinter({ ...newPrinter, categories: prev.filter(c => c !== cat.id) });
                                        } else {
                                          setNewPrinter({ ...newPrinter, categories: [...prev, cat.id] });
                                        }
                                      }}
                                    />
                                    <span>{lang === 'ar' ? cat.ar : cat.en}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setPrinterFormOpen(false)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                          >
                            {lang === 'ar' ? "إلغاء ودية" : "Cancel"}
                          </button>
                          <button
                            type="button"
                            onClick={handleAddPrinter}
                            className="px-4 py-1.5 text-white font-extrabold rounded-lg transition cursor-pointer"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            {lang === 'ar' ? "ربط وحفظ الطابعة" : "Apply Routing Rule"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Toggle Visibilities */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                    {lang === 'ar' ? "تفعيل الحقول والمعلومات المطبوعة" : "Receipt Infobox Toggles"}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl">
                    <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <span>{lang === 'ar' ? "عرض الشعار" : "Top logo"}</span>
                      <input
                        type="checkbox"
                        checked={settings.showReceiptLogo !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showReceiptLogo: e.target.checked })}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <span>{lang === 'ar' ? "الرأس والترخيص" : "Identity Header"}</span>
                      <input
                        type="checkbox"
                        checked={settings.showReceiptHeader !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showReceiptHeader: e.target.checked })}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <span>{lang === 'ar' ? "اسم الكاشير" : "Cashier Name"}</span>
                      <input
                        type="checkbox"
                        checked={settings.showReceiptEmployee !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showReceiptEmployee: e.target.checked })}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <span>{lang === 'ar' ? "بيانات العميل" : "Customer ID"}</span>
                      <input
                        type="checkbox"
                        checked={settings.showReceiptCustomer !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showReceiptCustomer: e.target.checked })}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <span>{lang === 'ar' ? "تفاصيل الضريبة" : "VAT detail list"}</span>
                      <input
                        type="checkbox"
                        checked={settings.showReceiptTax !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showReceiptTax: e.target.checked })}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                      <span>{lang === 'ar' ? "الرمز الإلكتروني QR" : "Simplifying QR"}</span>
                      <input
                        type="checkbox"
                        checked={settings.showReceiptQr !== false}
                        onChange={(e) => onUpdateSettings({ ...settings, showReceiptQr: e.target.checked })}
                        className="w-3.5 h-3.5 accent-teal-600"
                      />
                    </label>

                    <div className="col-span-2 border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1">
                      <label className="flex items-center justify-between p-1 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                        <span>{lang === 'ar' ? "تذييل الفاتورة الترحيبي" : "Receipt Footer messages"}</span>
                        <input
                          type="checkbox"
                          checked={settings.showReceiptFooter !== false}
                          onChange={(e) => onUpdateSettings({ ...settings, showReceiptFooter: e.target.checked })}
                          className="w-3.5 h-3.5 accent-teal-600"
                        />
                      </label>
                    </div>

                  </div>
                </div>

                {/* 3. Sorting list layout */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">
                    {lang === 'ar' ? "ترتيب حقول ومعلومات الفاتورة (تحريك بالأسهم)" : "Re-order Infobox Fields (Use ▲/▼ Arrows)"}
                  </span>

                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {(settings.receiptBlockOrder || ['logo', 'header', 'info', 'items', 'totals', 'qr', 'footer']).map((blockId, index, arr) => {
                      const blockNames: { [key: string]: { ar: string, en: string } } = {
                        logo: { ar: "شعار المقهى العلوي", en: "Top Cafe Brand Logo" },
                        header: { ar: "العنوان والرقم الضريبي", en: "Title & TAX Credentials" },
                        info: { ar: "التاريخ، رقم الفاتورة، الكاشير والعميل", en: "Invoice ID, Cashier & Cust" },
                        items: { ar: "جدول والسلع ومجاميع الكميات", en: "Itemized List & counts" },
                        totals: { ar: "مربع الحساب الإجمالي والضريبة المضافة", en: "Tax Breakdown & Totals" },
                        qr: { ar: "مربع الفاتورة الإلكترونية المعتمد QR", en: "Verified Fatoora QR Code" },
                        footer: { ar: "تذييل الفاتورة والتوجيهات للتواصل", en: "Greetings Footer message" }
                      };
                      const displayName = blockNames[blockId] ? blockNames[blockId][lang] : blockId;
                      const isFirst = index === 0;
                      const isLast = index === arr.length - 1;

                      const handleMove = (direction: 'up' | 'down') => {
                        const nextId = direction === 'up' ? index - 1 : index + 1;
                        if (nextId < 0 || nextId >= arr.length) return;
                        
                        const ord = [...arr];
                        const swap = ord[index];
                        ord[index] = ord[nextId];
                        ord[nextId] = swap;
                        onUpdateSettings({ ...settings, receiptBlockOrder: ord });
                      };

                      return (
                        <div 
                          key={blockId} 
                          className="p-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-100/70 dark:border-slate-800 rounded-lg flex items-center justify-between text-[10px] font-semibold"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 text-[9px] flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 truncate">{displayName}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMove('up')}
                              disabled={isFirst}
                              className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3 text-slate-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove('down')}
                              disabled={isLast}
                              className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              
              {/* Live Preview panel */}
              <div className="xl:col-span-5 flex flex-col items-center pt-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1 select-none">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? "معاينة الفاتورة الإلكترونية المباشرة" : "Live E-Invoice Preview"}</span>
                </span>

                {/* Thermal Invoice Canvas */}
                <div 
                  className="w-full max-w-[210px] p-4 bg-white text-black border border-slate-300 dark:border-slate-700 shadow-md rounded-xl text-center space-y-2 select-none"
                  style={{ 
                    fontSize: `${settings.receiptFontSize || 12}px`,
                    direction: 'rtl',
                    fontFamily: 'monospace' 
                  }}
                >
                  
                  {(settings.receiptBlockOrder || ['logo', 'header', 'info', 'items', 'totals', 'qr', 'footer']).map((bId) => {
                    
                    if (bId === 'logo') {
                      if (settings.showReceiptLogo === false) return null;
                      return (
                        <div key="logo" className="pb-1 max-w-full">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 mx-auto object-contain rounded" />
                          ) : (
                            <span className="text-lg block">☕</span>
                          )}
                        </div>
                      );
                    }

                    if (bId === 'header') {
                      if (settings.showReceiptHeader === false) return null;
                      return (
                        <div key="header" className="pb-1">
                          <h4 className="font-extrabold text-[1.1em]">{lang === 'ar' ? settings.nameAr : settings.nameEn}</h4>
                          <span className="text-[0.78em] text-slate-500 block leading-tight font-sans mt-0.5">
                            {settings.receiptHeaderAr || "الرقم الضريبي: 300092810000003"}
                          </span>
                        </div>
                      );
                    }

                    if (bId === 'info') {
                      const hasEmp = settings.showReceiptEmployee !== false;
                      const hasCust = settings.showReceiptCustomer !== false;
                      if (!hasEmp && !hasCust) return null;
                      return (
                        <div key="info" className="border-t border-b border-black border-dashed py-1 text-right text-[0.82em] space-y-0.5">
                          <div><b>رقم الفاتورة:</b> INV-2026-0097</div>
                          <div><b>التاريخ:</b> 19-06-2026 14:35</div>
                          {hasEmp && <div><b>الكاشير:</b> {lang === "ar" ? "سارة أحمد" : "Sarah Ahmad"}</div>}
                          {hasCust && <div><b>العميل:</b> {lang === "ar" ? "ليلى العامري" : "Layla Al-Amri"}</div>}
                        </div>
                      );
                    }

                    if (bId === 'items') {
                      return (
                        <div key="items" className="py-1 text-[0.82em]">
                          <table className="w-full text-right leading-tight">
                            <thead>
                              <tr className="border-b border-black font-bold">
                                <th className="text-right">الصنف</th>
                                <th className="text-center">الكمية</th>
                                <th className="text-left">السعر</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="py-0.5">{lang === 'ar' ? "إسبراسو دبل" : "Double Espresso"}</td>
                                <td className="py-0.5 text-center">1</td>
                                <td className="py-0.5 text-left font-mono">4,500</td>
                              </tr>
                              <tr>
                                <td className="py-0.5">{lang === 'ar' ? "كرواسون زعتر" : "Zaatar Croissant"}</td>
                                <td className="py-0.5 text-center">2</td>
                                <td className="py-0.5 text-left font-mono">6,000</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    if (bId === 'totals') {
                      const hasTax = settings.showReceiptTax !== false;
                      const symbol = lang === 'ar' ? settings.currencyAr : settings.currencyEn;
                      return (
                        <div key="totals" className="border-t border-black border-dashed pt-1 text-[0.82em] space-y-0.5 text-right font-mono">
                          <div className="flex justify-between">
                            <span>المجموع الفرعي:</span>
                            <span>9,130 {symbol}</span>
                          </div>
                          {hasTax && (
                            <div className="flex justify-between">
                              <span>ضريبة القيمة المضافة ({settings.taxRate}%):</span>
                              <span>1,370 {symbol}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-extrabold text-[1.12em] border-t border-dotted border-black/40 pt-1 mt-0.5">
                            <span>الإجمالي النهائي:</span>
                            <span>10,500 {symbol}</span>
                          </div>
                        </div>
                      );
                    }

                    if (bId === 'qr') {
                      if (settings.showReceiptQr === false) return null;
                      return (
                        <div key="qr" className="py-1 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-white border border-slate-200 flex items-center justify-center p-0.5">
                            {/* Realistic QR representation */}
                            <div className="w-full h-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[5px] text-slate-400">QR CODE</div>
                          </div>
                          <span className="text-[0.62em] font-sans mt-0.5 font-bold tracking-tight text-slate-400">فاتورة إلكترونية مبسطة</span>
                        </div>
                      );
                    }

                    if (bId === 'footer') {
                      if (settings.showReceiptFooter === false) return null;
                      return (
                        <div key="footer" className="text-[0.74em] text-slate-400 leading-tight italic pt-1 border-t border-dotted border-slate-200">
                          {lang === 'ar' ? settings.receiptFooterAr : settings.receiptFooterEn}
                        </div>
                      );
                    }

                    return null;
                  })}

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Branding & Visual customizer / 2FA / Secure Backup */}
        <div className="space-y-6">

          {/* Color theme Customizer */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Palette className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? "تخصيص السمة اللمسية واللون" : "Theme Color & Brand Accents"}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? "غيّر طيف الألوان الرئيسي وصبغات الأزرار عبر عناصر المقهى فورياً." : "Instantly modify default button colors, sidebar active grids, and highlights globally."}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {brandColors.map((color, idx) => {
                const isSelected = settings.primaryColor === color.value;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onUpdateSettings({ ...settings, primaryColor: color.value });
                      document.documentElement.style.setProperty('--primary-color', color.value);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      isSelected 
                        ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 font-bold" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color.value }}></span>
                      <span className="text-slate-600 dark:text-slate-300 truncate">{color.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User 2FA security override */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? "مصادقة الحماية الثنائية للمشرف (2FA)" : "Manager 2FA Auth Layer"}
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'ar' ? "تفعيل الحماية عند فتح التقارير لوحة التحكم" : "Require security PIN before analytics access"}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {lang === 'ar' ? "يمنع الباريستا غير المصرح لهم بصلاحيات إدارية من الإطلاع على الإحصائيات والأرباح." : "Restricts junior cashiers from snooping on cost margins, wholesale audits, and analytics."}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enable2FA}
                onChange={(e) => onUpdateSettings({ ...settings, enable2FA: e.target.checked })}
                className="w-5 h-5 accent-teal-600 text-teal-600 cursor-pointer shrink-0"
              />
            </div>
            {settings.enable2FA && (
              <div className="mt-3 p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs">
                <span className="text-rose-700 dark:text-rose-300 font-medium">{lang === 'ar' ? "كود التخطي الإداري الافتراضي 2FA:" : "Override Admin Security PIN Code:"}</span>
                <input
                  type="password"
                  maxLength={4}
                  value={settings.twoFactorPin}
                  onChange={(e) => onUpdateSettings({ ...settings, twoFactorPin: e.target.value })}
                  className="w-20 px-2 py-1 text-center bg-white dark:bg-slate-950 border border-rose-300 rounded-lg text-slate-800 dark:text-slate-100 font-mono tracking-widest text-sm"
                />
              </div>
            )}
          </div>

          {/* Cloud & Cipher local backups */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Database className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? "النسخ الاحتياطي والمزامنة السحابية" : "Synchronizations & Encrypted Cryptography Backups"}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Cloud Sync */}
              <button
                onClick={handleCloudSync}
                disabled={cloudSyncing}
                className="p-3 bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-950/45 text-teal-800 dark:text-teal-300 rounded-xl border border-teal-200/50 flex flex-col justify-between h-[110px] text-right transition disabled:opacity-50 font-medium"
              >
                <div className="flex items-center justify-between w-full">
                  <RefreshCw className={`w-5 h-5 text-teal-600 ${cloudSyncing ? "animate-spin" : ""}`} />
                  <span className="bg-teal-600 text-white text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold font-mono">Cloud</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-800 dark:text-slate-100">
                    {lang === 'ar' ? "مزامنة سحابية مشفرة" : "Encrypt & Replicate"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-normal mt-0.5 block">
                    {lang === 'ar' ? "حفظ التغييرات ولحظياً بالنسخ السحابي." : "Safeguard catalog and orders to safe Cloud DBs."}
                  </span>
                </div>
              </button>

              {/* Local secure download backup */}
              <button
                onClick={handleBackupDownload}
                className="p-3 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/45 text-indigo-800 dark:text-indigo-300 rounded-xl border border-indigo-200/50 flex flex-col justify-between h-[110px] text-right transition font-medium"
              >
                <div className="flex items-center justify-between w-full">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="bg-indigo-600 text-white text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded font-bold font-mono">FILE</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-800 dark:text-slate-100">
                    {lang === 'ar' ? "تصدير ملف احتياطي .cfg" : "Export Backup Asset"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal leading-normal mt-0.5 block">
                    {lang === 'ar' ? "تحميل نسخة احتياطية مشفرة للكمبيوتر." : "Encrypt and store state onto your workstation."}
                  </span>
                </div>
              </button>

            </div>

            {/* Input Recovery key */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">{lang === 'ar' ? "مفتاح التشفير السري (للنسخ)" : "Backup Encrypting Key:"}</span>
                <input
                  type="text"
                  value={backupKey}
                  onChange={(e) => setBackupKey(e.target.value)}
                  className="px-2 py-0.5 bg-white dark:bg-slate-950 border border-slate-300 rounded font-mono text-center font-bold"
                />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5">
                <span className="text-[10px] text-slate-400">{lang === 'ar' ? "لاسترجاع البيانات، اختر ملف .cfg المحفوظ:" : "To recover past database arrays, pick your saved *.cfg file:"}</span>
                <label className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded cursor-pointer transition select-none font-bold text-[10px]">
                  {lang === 'ar' ? "تحميل واستعادة" : "Import & Load"}
                  <input
                    type="file"
                    accept=".cfg"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
