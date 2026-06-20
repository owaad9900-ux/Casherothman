/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, HelpCircle } from "lucide-react";
import { ChatMessage } from "../types";

interface SupportChatbotProps {
  lang: 'ar' | 'en';
}

export default function SupportChatbot({ lang }: SupportChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: lang === "ar" 
        ? "أهلاً بك في نظام المساعدة الذكي للمقهى ☕! أنا باريستا بوت (BaristaBot) المساعد الخاص بك على مدار الساعة بالذكاء الاصطناعي. كيف أستطيع خدمتك اليوم؟ يمكنك سؤالي عن كيفية إدارة الفواتير، طباعة الشعار، ضريبة القيمة المضافة أو سبل تحضير القهوة في ثوانٍ معدودة!" 
        : "Welcome to the Smart Cafe Help desk ☕! I'm BaristaBot, your 24/7 AI-powered technical and operational assistant. How can I assist you today? Ask me about managing invoices, uploading custom logos, configuring VAT, or brewing methods!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickQuestionsAr = [
    "كيف أقوم بتعديل ضريبة القيمة المضافة؟",
    "طريقة تحميل شعار المقهى للطباعة؟",
    "تفعيل وضع الحماية الثنائية 2FA؟",
    "ما هي عروض القهوة الأكثر طلباً لليوم؟"
  ];

  const quickQuestionsEn = [
    "How do I configure VAT tax rate?",
    "How to load a custom logo for receipts?",
    "How to enable 2FA protection?",
    "What are our morning specialty sales tips?"
  ];

  const quickQuestions = lang === "ar" ? quickQuestionsAr : quickQuestionsEn;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      // Assemble full thread for context
      const thread = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: thread, lang })
      });

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "model",
        text: data.text || (lang === 'ar' ? "عذراً، لم أستطع فهم رسالتك بوضوح." : "Sorry, I couldn't process your message."),
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        text: lang === 'ar' 
          ? "تنبيه: حدث خطأ أثناء الاتصال بخادم الذكاء الاصطناعي. تعمل المحادثة الآن في وضع الاستجابة الأساسية الاحتياطية."
          : "System: Failed to connect to AI server. Running on default offline response.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Bot Header */}
      <div className="p-4 bg-teal-600 dark:bg-teal-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-teal-600 dark:border-teal-900 rounded-full animate-ping"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">
              {lang === "ar" ? "المساعد التفاعلي باريستا بوت" : "BaristaBot Support"}
            </h3>
            <p className="text-[11px] text-teal-100 font-mono">
              ⚡ {lang === "ar" ? "متصل بالذكاء الاصطناعي" : "Powered by Gemini 3.5"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-teal-700/50 text-[10px] uppercase font-mono">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>{lang === "ar" ? "لحظي" : "Active"}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/20">
        {messages.map((msg) => {
          const isModel = msg.role === "model";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isModel ? "self-start float-left" : "self-end float-right flex-row-reverse ml-auto"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isModel 
                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100/30" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                }`}
              >
                {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              
              <div className="space-y-1 clear-both">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    isModel
                      ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800/85 relative"
                      : "bg-teal-600 text-white rounded-tr-none"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.text}
                </div>
                <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 justify-end px-1">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-xs py-1">
            <Bot className="w-4 h-4 animate-bounce text-teal-600" />
            <span>{lang === "ar" ? "باريستا بوت يفكر يكتب الآن..." : "BaristaBot is typing..."}</span>
          </div>
        )}
        <div ref={scrollRef} className="clear-both" />
      </div>

      {/* Suggested Quick Buttons */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 w-full mb-1">
          <HelpCircle className="w-3.5 h-3.5" />
          {lang === "ar" ? "أسئلة شائعة اقترحها النظام:" : "Recommended Quick Queries:"}
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={loading}
            className="text-[11px] px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={lang === "ar" ? "اسأل باريستا بوت عن تفاصيل المبيعات أو المخزون..." : "Ask BaristaBot about POS functions, sales, stock levels..."}
          className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
          dir={lang === "ar" ? "rtl" : "ltr"}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-2 px-3.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-40 text-white rounded-xl transition flex items-center justify-center"
        >
          <Send className={`w-4 h-4 ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
      </form>
    </div>
  );
}
