import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Coffee, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور / Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Localized clean error messaging
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("خطأ في البريد الإلكتروني أو كلمة المرور / Incorrect email or password");
      } else if (err.code === "auth/invalid-email") {
        setError("بريد إلكتروني غير صالح / Invalid email address");
      } else {
        setError(err.message || "فشل تسجيل الدخول. أعد المحاولة / Login failed. Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-800 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden"
      >
        {/* Top styling header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono">
            V2.0 PRO
          </div>
          <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg mb-4">
            <Coffee className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">منصة إدارة المقاهي الذكية</h1>
          <p className="text-slate-100 text-sm font-light mt-1" dir="ltr">
            Smart Café POS & Cloud Management
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 bg-red-950/40 border border-red-800/60 text-red-200 p-3.5 rounded-xl text-xs"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-slate-300">البريد الإلكتروني</label>
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">Email Address</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="name@cafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 pr-11 pl-4 py-3 rounded-xl text-slate-100 placeholder-slate-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
                <span className="text-[10px] text-slate-400 font-mono" dir="ltr">Password</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 pr-11 pl-12 py-3 rounded-xl text-slate-100 placeholder-slate-500 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>الرجاء الانتظار... / Logging in...</span>
                  </span>
                ) : (
                  <>
                    <span>تسجيل الدخول / Log In</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Prompt info */}
          <div className="mt-8 pt-6 border-t border-slate-700/40 text-center text-xs text-slate-400 leading-relaxed">
            <p>يرجى إدخال حساب مقهاك للاتصال بقاعدة البيانات السحابية الحية.</p>
            <p className="mt-1 text-slate-500" dir="ltr">
              Only authorized cafés and platform administrator can sign in.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
