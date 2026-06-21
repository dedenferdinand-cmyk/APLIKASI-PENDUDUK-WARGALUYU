/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogIn, Key, User, Moon, Sun } from "lucide-react";
import { User as UserType } from "../types";
import { db } from "../db/mockSupabase";

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function LoginView({ onLoginSuccess, darkMode, setDarkMode, addToast }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const executeInstantLogin = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
    setIsLoading(true);
    setTimeout(() => {
      try {
        const users = db.getUsers();
        const matched = users.find(u => u.username.toLowerCase() === userVal.toLowerCase().trim());
        
        let authenticated = false;
        if (matched) {
          if (matched.username === "admin" && (passVal === "wargaluyu123" || passVal === "admin")) authenticated = true;
          else if (matched.username !== "admin" && (passVal === matched.username || passVal === "wargaluyu123" || passVal === "admin")) authenticated = true;
        }

        if (authenticated && matched) {
          db.setCurrentUser(matched);
          db.addLog(matched, "Berhasil masuk ke dalam sistem SIPENDUK.");
          addToast(`Selamat datang kembali, ${matched.nama}!`, "success");
          onLoginSuccess(matched);
        } else {
          addToast("Username atau Password salah! Silakan coba lagi.", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Terjadi kesalahan sistem.", "error");
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast("Username dan Password wajib diisi!", "warning");
      return;
    }

    setIsLoading(true);

    // Simulate database lookup network latency
    setTimeout(() => {
      try {
        const users = db.getUsers();
        const matched = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
        
        let authenticated = false;
        if (matched) {
          if (matched.username === "admin" && (password === "wargaluyu123" || password === "admin")) authenticated = true;
          else if (matched.username !== "admin" && (password === matched.username || password === "wargaluyu123" || password === "admin")) authenticated = true;
        }

        if (authenticated && matched) {
          db.setCurrentUser(matched);
          db.addLog(matched, "Berhasil masuk ke dalam sistem SIPENDUK.");
          addToast(`Selamat datang kembali, ${matched.nama}!`, "success");
          onLoginSuccess(matched);
        } else {
          addToast("Username atau Password salah! Silakan coba lagi.", "error");
        }
      } catch (err: any) {
        addToast(err.message || "Terjadi kesalahan sistem.", "error");
      } finally {
        setIsLoading(false);
      }
    }, 850);
  };

  return (
    <div id="login-screen" className="min-h-screen relative flex flex-col justify-center items-center px-4 overflow-hidden bg-[#f2faf5] dark:bg-[#030e09] transition-colors duration-300">
      
      {/* Background Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main glass box container */}
      <div 
        id="login-card"
        className="w-full max-w-md bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 rounded-2xl p-8 backdrop-blur-lg shadow-xl relative z-10 transition-all hover:shadow-emerald-500/5 hover:bg-white/70 dark:hover:bg-slate-900/70"
      >
        {/* Banner Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-4">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-75 blur-md group-hover:opacity-100 transition duration-1000" />
            <img 
              src="/src/assets/images/logo_wargaluyu_1781767575148.jpg" 
              alt="Logo Desa Wargaluyu"
              referrerPolicy="no-referrer"
              className="relative w-20 h-20 rounded-full border border-emerald-400 bg-slate-900 object-cover shadow-inner"
            />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-center bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            SIPENDUK WARGALUYU
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider mt-1.5 leading-relaxed px-2">
            Desa Wargaluyu Kecamatan Arjasari Kabupaten Bandung
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" /> Username
            </label>
            <input
              id="input-username"
              type="text"
              required
              placeholder="Masukkan username anda"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-500" /> Password
            </label>
            <input
              id="input-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 text-slate-950 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memverifikasi...
              </span>
            ) : (
              <>
                <LogIn className="w-4.5 h-4.5" /> Masuk Sistem
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">
            PINTASAN MASUK (KLIK UNTUK MASUK INSTAN):
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => executeInstantLogin("admin", "admin")}
              className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer"
            >
              <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Admin Desa</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-semibold mt-0.5">admin / admin</div>
            </button>

            <button
              type="button"
              onClick={() => executeInstantLogin("rw01", "rw01")}
              className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer"
            >
              <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Ketua RW 01</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-semibold mt-0.5">rw01 / rw01</div>
            </button>

            <button
              type="button"
              onClick={() => executeInstantLogin("rw02", "rw02")}
              className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer"
            >
              <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Ketua RW 02</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-semibold mt-0.5">rw02 / rw02</div>
            </button>

            <button
              type="button"
              onClick={() => executeInstantLogin("rt0101", "rt0101")}
              className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer"
            >
              <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Ketua RT 01/RW 01</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-semibold mt-0.5">rt0101 / rt0101</div>
            </button>

            <button
              type="button"
              onClick={() => executeInstantLogin("rt0102", "rt0102")}
              className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer"
            >
              <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Ketua RT 02/RW 01</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-semibold mt-0.5">rt0102 / rt0102</div>
            </button>

            <button
              type="button"
              onClick={() => executeInstantLogin("rt0201", "rt0201")}
              className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800 transition text-left cursor-pointer"
            >
              <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">Ketua RT 01/RW 02</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-mono font-semibold mt-0.5">rt0201 / rt0201</div>
            </button>
          </div>
        </div>

      </div>

      {/* Footer credits in margin style */}
      <p className="text-[10px] text-slate-400 dark:text-slate-650 mt-8 text-center self-center max-w-sm">
        Pemerintah Desa Wargaluyu • Kecamatan Arjasari, Kabupaten Bandung • SIPENDUK v2.0
      </p>
    </div>
  );
}
