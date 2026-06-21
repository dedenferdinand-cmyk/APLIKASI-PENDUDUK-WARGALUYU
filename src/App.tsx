/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Home, 
  Users, 
  Contact, 
  Baby, 
  HeartCrack, 
  Truck, 
  FileSpreadsheet, 
  Fingerprint, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  ChevronsLeft, 
  ChevronsRight,
  ShieldCheck,
  Bell,
  Clock
} from "lucide-react";

// Components
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import KeluargaView from "./components/KeluargaView";
import PendudukView from "./components/PendudukView";
import KelahiranView from "./components/KelahiranView";
import KematianView from "./components/KematianView";
import MutasiView from "./components/MutasiView";
import ImportExportView from "./components/ImportExportView";
import UserManagementView from "./components/UserManagementView";
import PengaturanView from "./components/PengaturanView";
import Toast from "./components/Toast";

import { User as UserType } from "./types";
import { db } from "./db/mockSupabase";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Dark Mode State - Permanently Set to Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "warning" | "info" }>>([]);

  const addToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("SIPENDUK_DARK_MODE", "true");
  }, []);

  // Check login session on load
  useEffect(() => {
    const session = db.getCurrentUser();
    if (session) {
      setCurrentUser(session);
      addToast(`Sesi login dipulihkan: Selamat Datang Bpk/Ibu ${session.nama}`, "info");
    }
  }, []);

  // Background Automatic Real-Time Sync Daemon
  useEffect(() => {
    if (!currentUser) return;

    const initialSync = async () => {
      try {
        const success = await db.syncAll(true);
        if (success) {
          window.dispatchEvent(new CustomEvent("sipenduk-db-updated"));
        }
      } catch (err) {
        console.warn("[App Background Sync Error] Initial fetch failed:", err);
      }
    };
    initialSync();

    const intervalId = setInterval(async () => {
      try {
        const success = await db.syncAll(true);
        if (success) {
          window.dispatchEvent(new CustomEvent("sipenduk-db-updated"));
        }
      } catch (err) {
        console.warn("[App Background Sync Error] Background interval sync failed:", err);
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleLoginSuccess = (user: UserType) => {
    setCurrentUser(user);
    addToast(`Autentikasi Berhasil! Selamat datang di SIPENDUK, ${user.nama}.`, "success");
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    addToast("Anda telah keluar dari SIPENDUK Wargaluyu.", "warning");
    setCurrentUser(null);
  };

  // Navigation Items
  const menuItems = [
    { id: "dashboard", label: "Dashboard Utama", icon: Home },
    { id: "kk", label: "Data Keluarga (KK)", icon: Users },
    { id: "penduduk", label: "Data Penduduk (SIAK)", icon: Contact },
    { id: "kelahiran", label: "Pencatatan Kelahiran", icon: Baby },
    { id: "kematian", label: "Pencatatan Kematian", icon: HeartCrack },
    { id: "mutasi", label: "Mutasi Domisili", icon: Truck },
    { id: "import_export", label: "Import / Ekspor", icon: FileSpreadsheet },
    { 
      id: "user_mgmt", 
      label: "Manajemen Akun", 
      icon: Fingerprint,
      adminOnly: true 
    },
    { id: "settings", label: "Pengaturan Sistem", icon: Settings },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
        <LoginView onLoginSuccess={handleLoginSuccess} darkMode={darkMode} setDarkMode={setDarkMode} addToast={addToast} />
        <Toast toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Segment filter based on Admin privilege
  const allowedMenuItems = menuItems.filter(item => {
    if (item.adminOnly && currentUser.role !== "ADMIN_DESA") {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f2faf5] dark:bg-[#030e09] font-sans flex flex-col md:flex-row transition-colors duration-200 text-slate-800 dark:text-emerald-50 relative overflow-hidden">
      
      {/* Background Mesh Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/40 dark:bg-emerald-950/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-200/30 dark:bg-indigo-950/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* SIDEBAR FOR DESKTOP */}
      <aside 
        id="desktop-sidebar"
        className={`hidden md:flex flex-col bg-emerald-950/90 dark:bg-emerald-950/95 text-emerald-100 border-r border-white/10 shrink-0 select-none transition-all duration-300 relative z-20 backdrop-blur-xl ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header Brand with Logo */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-400 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-400/20">
              <span className="text-emerald-900 text-sm font-black">W</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 transition-opacity duration-300">
                <span className="block text-xs font-black tracking-widest text-white font-mono">SIPENDUK</span>
                <span className="block text-[9px] font-bold text-emerald-250 mt-0.5 tracking-tight truncate">Kec. Arjasari, Kab. Bandung</span>
              </div>
            )}
          </div>

          <button 
            id="btn-sidebar-collapse"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-emerald-300 hover:text-white transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation block */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`menu-item-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group cursor-pointer ${
                  isActive 
                    ? "bg-white/10 text-white shadow-md border border-white/10" 
                    : "text-emerald-100/70 hover:text-white hover:bg-white/5"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-emerald-305"}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Footer Panel */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8.5 h-8.5 rounded-full bg-emerald-450/20 text-emerald-300 font-black flex items-center justify-center shrink-0 border border-white/10 text-xs">
              {currentUser.nama.substring(0,1)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 leading-none">
                <span className="block text-[11px] font-bold text-white truncate">{currentUser.nama}</span>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[8px] font-black tracking-widest text-emerald-250 uppercase font-mono">
                  {currentUser.role.replace("KETUA_", "")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-1 w-full">
            {/* Logout button spanning fully/compactly */}
            {!sidebarCollapsed ? (
              <button
                id="btn-logout-sidebar"
                onClick={handleLogout}
                className="w-full py-1.5 px-2.5 rounded-lg border border-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-all font-bold text-[10px] text-center cursor-pointer"
              >
                KELUAR
              </button>
            ) : (
              <button
                id="btn-logout-icon-sidebar"
                onClick={handleLogout}
                className="w-full flex justify-center p-1.5 rounded-lg border border-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                title="Keluar Sesi"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR NAVIGATION HEADER */}
      <header className="md:hidden flex items-center justify-between bg-emerald-950/90 text-emerald-50 border-b border-white/10 py-3 px-4 shrink-0 select-none z-30 backdrop-blur-md">
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-400 flex items-center justify-center font-extrabold text-emerald-950 text-xs">
            W
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white">SIPENDUK</h1>
            <p className="text-[8px] text-emerald-305 tracking-wider uppercase font-bold text-center">Kec. Arjasari, Kab. Bandung</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-logout-mobile"
            onClick={handleLogout}
            className="text-[10px] font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/20 cursor-pointer"
          >
            LOGOUT
          </button>
        </div>

      </header>

      {/* MOBILE BOTTOM NAVIGATION (Premium feel scrolling selector tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-emerald-950/95 backdrop-blur-md border-t border-white/10 px-2.5 py-1.5 flex items-center justify-around">
        {allowedMenuItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`mobile-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[9px] font-bold transition-all relative ${
                isActive ? "text-emerald-450 scale-102 font-extrabold" : "text-emerald-300/60"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(" ")[0]}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-450 mt-0.5" />
              )}
            </button>
          );
        })}
        {allowedMenuItems.length > 5 && (
          <button
            id="btn-mobile-more-tabs"
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[9px] font-bold ${
              activeTab === "settings" || activeTab === "import_export" || activeTab === "user_mgmt" 
                ? "text-emerald-450 font-extrabold" 
                : "text-emerald-300/60"
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span>Sistem</span>
          </button>
        )}
      </div>

      {/* MAIN LAYOUT CANVAS WRAPPER */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto pb-20 md:pb-6">
        
        {/* TOP STATUS RIBBON info header */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 bg-white/40 dark:bg-[#030e09]/40 border-b border-white/20 dark:border-white/5 backdrop-blur-md text-xs relative z-10">
          
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-medium">Lokasi: <strong>Desa Wargaluyu Kecamatan Arjasari Kabupaten Bandung</strong></span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Secured RLS Territory Alert Tag info */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/15 rounded-full text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RLS ACTIVE: {currentUser.role}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5 font-bold text-slate-650 dark:text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>POSTGRESQL INSTANCE ONLINE</span>
            </div>

          </div>

        </div>

        {/* SCROLLABLE ROUTER PANEL STAGE */}
        <div className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          
          {activeTab === "dashboard" && (
            <DashboardView currentUser={currentUser} addToast={addToast} onNavigate={setActiveTab} />
          )}

          {activeTab === "kk" && (
            <KeluargaView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "penduduk" && (
            <PendudukView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "kelahiran" && (
            <KelahiranView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "kematian" && (
            <KematianView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "mutasi" && (
            <MutasiView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "import_export" && (
            <ImportExportView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "user_mgmt" && (
            <UserManagementView currentUser={currentUser} addToast={addToast} />
          )}

          {activeTab === "settings" && (
            <PengaturanView currentUser={currentUser} addToast={addToast} onLogout={handleLogout} />
          )}

        </div>

      </main>

      {/* FLOAT FLOATING NOTIFICATIONS TOAST */}
      <Toast toasts={toasts} onClose={removeToast} />

    </div>
  );
}
