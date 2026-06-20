import React, { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db, firebaseConfig, collection, doc, setDoc, onSnapshot } from "../lib/firebase";
import { 
  Users, 
  PlusCircle, 
  Store, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  LogOut,
  Sparkles,
  ArrowRightLeft
} from "lucide-react";
import { motion } from "motion/react";

interface AdminPanelProps {
  onSelectCafe: (cafeId: string, cafeNameAr: string, cafeNameEn: string) => void;
  onLogout: () => void;
  adminEmail: string;
}

interface Cafe {
  cafeId: string;
  nameAr: string;
  nameEn: string;
  ownerEmail: string;
  createdAt: string;
}

export default function AdminPanel({ onSelectCafe, onLogout, adminEmail }: AdminPanelProps) {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Live listener to fetch all registered cafes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "cafes"), (snap) => {
      const list: Cafe[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Cafe);
      });
      // Sort by creation date
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCafes(list);
    });
    return () => unsub();
  }, []);

  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn || !email || !password) {
      setError("الرجاء إدخال كافة الحقول / Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 خانات على الأقل / Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    // Create a temporary secondary app to register the user without logging out the administrator
    const tempAppName = `tempApp_${Date.now()}`;
    let tempApp;

    try {
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      
      // Register Auth user in secondary app
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email.trim(), password);
      const uid = userCredential.user.uid;

      // 1. Create Café Master Record
      const newCafe: Cafe = {
        cafeId: uid,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        ownerEmail: email.trim(),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "cafes", uid), newCafe);

      // 2. Pre-seed default settings for the newly created Cafe (multi-tenant isolation)
      await setDoc(doc(db, "cafes", uid, "settings", "default"), {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        taxRate: 15,
        currencyAr: "ر.س",
        currencyEn: "SAR",
        receiptHeaderAr: `مرحباً بكم في ${nameAr.trim()}`,
        receiptHeaderEn: `Welcome to ${nameEn.trim()}`,
        receiptFooterAr: "شكراً لزيارتكم",
        receiptFooterEn: 'Thank you for your visit',
        primaryColor: "#4f46e5",
        accentColor: "#f43f5e",
        enableVat: true,
        enable2FA: false,
        twoFactorPin: "1234"
      });

      // Clear inputs
      setNameAr("");
      setNameEn("");
      setEmail("");
      setPassword("");
      setSuccess("تم إنشاء حساب المقهى بنجاح وسيد البيانات التلقائية! / Café created and seeded successfully!");
    } catch (err: any) {
      console.error("Error creating cafe:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("هذا البريد الإلكتروني مستخدم بالفعل / This email is already in use");
      } else if (err.code === "auth/invalid-email") {
        setError("بريد إلكتروني غير صالح / Invalid email address format");
      } else {
        setError(err.message || "حدث خطأ أثناء الإنشاء / Error during creation");
      }
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans" dir="rtl">
      {/* Top Admin Header Bar */}
      <header className="bg-slate-800 border-b border-slate-700/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-md">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">بوابة مسؤول الأنظمة والمنصة</h1>
              <p className="text-xs text-slate-400 font-mono" dir="ltr">
                Platform Administrator Dashboard (SysAdmin Panel)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-sm">
              <span className="text-slate-300 font-medium">مسؤول المنصة:</span>
              <span className="text-xs text-indigo-400 font-mono" dir="ltr">{adminEmail}</span>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 text-red-200 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل خروج / Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Right Column: Register a New Cafe Form */}
          <section className="lg:col-span-5 bg-slate-800 rounded-3xl border border-slate-700/40 p-6 self-start shadow-xl">
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-700/50">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">تسجيل مقهى جديد بالمنصة</h2>
            </div>

            <form onSubmit={handleCreateCafe} className="space-y-4">
              
              {error && (
                <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/60 text-red-100 p-3.5 rounded-xl text-xs">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 bg-emerald-950/40 border border-emerald-800/60 text-emerald-100 p-3.5 rounded-xl text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Cafe Name AR */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">اسم المقهى (بالعربية)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="مثال: مقهى ريان"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-indigo-500 py-2.5 pr-10 pl-4 rounded-xl text-xs text-slate-100 outline-none placeholder-slate-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Cafe Name EN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">اسم المقهى (بالإنكليزية / English)</label>
                <div className="relative" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Rayan Café"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-indigo-500 py-2.5 pl-10 pr-4 rounded-xl text-xs text-slate-100 outline-none placeholder-slate-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">البريد الإلكتروني للذكاء والمسؤول</label>
                <div className="relative" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="cafe@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-indigo-500 py-2.5 pl-10 pr-4 rounded-xl text-xs text-slate-100 outline-none placeholder-slate-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">كلمة المرور (6 خانات على الأقل)</label>
                <div className="relative" dir="ltr">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-indigo-500 py-2.5 pl-10 pr-12 rounded-xl text-xs text-slate-100 outline-none placeholder-slate-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>الرجاء الانتظار... / Creating...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>تسجيل المقهى للخدمة السحابية</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Left Column: List of All Registered Cafes */}
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-slate-800 rounded-3xl border border-slate-700/40 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold">المقاهي النشطة بالبوابة ({cafes.length})</h2>
                </div>
                <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 font-mono px-2.5 py-1 rounded-full px-2">
                  LIVE STATUS
                </span>
              </div>

              {cafes.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm">لا يوجد مقاهي مسجلة بعد بالبوابة السحابية.</p>
                  <p className="text-xs text-slate-500 mt-1" dir="ltr">No registered cafes found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cafes.map((cafe) => (
                    <motion.div
                      key={cafe.cafeId}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="group bg-slate-900 border border-slate-700/50 hover:border-indigo-500/60 p-4 rounded-2xl flex flex-col justify-between gap-4 transition-all relative overflow-hidden"
                    >
                      {/* Accent glow on hover */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 pointer-events-none transition-all" />

                      <div className="space-y-3 relative z-10">
                        {/* Title and icons */}
                        <div className="flex items-start gap-2.5">
                          <div className="bg-indigo-950/50 border border-indigo-800/40 text-indigo-400 p-2 rounded-xl">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-100">{cafe.nameAr}</h3>
                            <h4 className="text-xs text-slate-400 font-medium" dir="ltr">{cafe.nameEn}</h4>
                          </div>
                        </div>

                        {/* Owner Email details */}
                        <div className="space-y-1.5 pt-1 text-xs text-slate-400 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-mono text-[11px] truncate block w-full" dir="ltr">
                              {cafe.ownerEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              تم التسجيل: {new Date(cafe.createdAt).toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action trigger button */}
                      <button
                        onClick={() => onSelectCafe(cafe.cafeId, cafe.nameAr, cafe.nameEn)}
                        className="w-full bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white border border-slate-700 group-hover:border-indigo-500/30 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all relative z-10 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>دخول كـ مقهى / Access POS</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
