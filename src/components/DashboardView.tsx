/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Home, 
  FileCheck, 
  Baby, 
  ShieldCheck, 
  Calendar,
  Activity,
  HeartCrack,
  MoveRight,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { User, Penduduk, Keluarga, AktivitasLog } from "../types";
import { db, hitungUmur, getCartoonAvatar } from "../db/mockSupabase";

interface DashboardViewProps {
  currentUser: User;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
  onNavigate: (viewId: string) => void;
}

export default function DashboardView({ currentUser, addToast, onNavigate }: DashboardViewProps) {
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
  const [recentPenduduk, setRecentPenduduk] = useState<Penduduk[]>([]);
  const [activityLogs, setActivityLogs] = useState<AktivitasLog[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const allPenduduk = await db.getPenduduk(currentUser);
      const allKeluarga = await db.getKeluarga(currentUser);
      const logs = await db.getLogs(currentUser);

      setPendudukList(allPenduduk);
      setKeluargaList(allKeluarga);
      setActivityLogs(logs.slice(0, 5)); // show latest 5
      setRecentPenduduk(allPenduduk.slice(0, 4)); // latest 4 registered
    } catch (err: any) {
      addToast("Gagal memuat data dashboard: " + err.message, "error");
    }
  };

  // 1. CALCULATE KORE STATISTICS
  const totalPenduduk = pendudukList.length;
  const totalKeluarga = keluargaList.length;
  
  const totalLaki = pendudukList.filter(p => p.jenisKelamin === "L").length;
  const totalPerempuan = pendudukList.filter(p => p.jenisKelamin === "P").length;

  const totalBalita = pendudukList.filter(p => {
    const umur = hitungUmur(p.tanggalLahir);
    return umur <= 5;
  }).length;

  const totalLansia = pendudukList.filter(p => {
    const umur = hitungUmur(p.tanggalLahir);
    return umur >= 60;
  }).length;

  // 2. CHART PREPARATION (DYNAMIC BASED ON DATABASE)
  // Chart A: Residents per RW
  const rws = Array.from(new Set(pendudukList.map(p => p.rw))).sort();
  const pendudukPerRwData = rws.map(rwNum => {
    const inRw = pendudukList.filter(p => p.rw === rwNum);
    // Find RT levels
    const rts = Array.from(new Set(inRw.map(p => p.rt))).sort();
    const rtBreakdownDetails = rts.map(rtNum => `RT ${rtNum}: ${inRw.filter(p => p.rt === rtNum).length}`).join(", ");

    return {
      name: `RW ${rwNum}`,
      "Jumlah Penduduk": inRw.length,
      "Kartu Keluarga": keluargaList.filter(k => k.rw === rwNum).length,
      detail: rtBreakdownDetails || "Tidak ada data RT"
    };
  });

  // Chart B: Gender (Laki-laki vs Perempuan)
  const genderData = [
    { name: "Laki-laki", value: totalLaki, color: "#10b981" }, // emerald-500
    { name: "Perempuan", value: totalPerempuan, color: "#3b82f6" } // blue-500
  ].filter(g => g.value > 0);

  // Chart C: Cohorts Growth over dates (Synthesized from input date months)
  const growthByMonth: { [key: string]: number } = {};
  pendudukList.forEach(p => {
    const d = new Date(p.tanggalInput);
    if (!Number.isNaN(d.getTime())) {
      const monthYear = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      growthByMonth[monthYear] = (growthByMonth[monthYear] || 0) + 1;
    }
  });

  // Sort and build cumulative totals
  let runningTotal = 0;
  const growthChartData = Object.keys(growthByMonth).map(month => {
    runningTotal += growthByMonth[month];
    return {
      bulan: month,
      "Total Penduduk Terdaftar": runningTotal,
      "Input Baru": growthByMonth[month]
    };
  });

  // Formatted date string for header
  const formattedToday = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic Jumbotron Header with user greeting */}
      <div className="p-6 rounded-2xl bg-emerald-950/80 dark:bg-emerald-950/90 border border-white/15 text-white relative overflow-hidden shadow-lg backdrop-blur-md z-10">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Mode Akses: {currentUser.role === "ADMIN_DESA" ? "Administrator Desa" : currentUser.role === "KETUA_RW" ? `Ketua RW ${currentUser.rw}` : `Ketua RT ${currentUser.rt}/RW ${currentUser.rw}`}
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              Sampurasun, {currentUser.nama}! 👋
            </h2>
            <p className="text-sm text-slate-300 mt-1 capitalize">
              Sistem mencatat data kependudukan real-time untuk lingkup pelayanan anda.
            </p>
          </div>
          <div className="flex items-center gap-2.5 self-start md:self-auto bg-slate-800/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/50">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-200">{formattedToday}</span>
          </div>
        </div>
      </div>

      {/* RLS Status Helper Info */}
      {(currentUser.role === "KETUA_RW" || currentUser.role === "KETUA_RT") && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
          <span>
            <strong>PostgreSQL Row-Level Security (RLS) Aktif:</strong> Statistik dan visualisasi di bawah ini otomatis disaring khusus untuk wilayah kerja Anda <strong>({currentUser.role === "KETUA_RW" ? `RW ${currentUser.rw}` : `RT ${currentUser.rt}/RW ${currentUser.rw}`}</strong>) demi menjaga privasi warga.
          </span>
        </div>
      )}

      {/* CORE STATISTIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* CARD Total Penduduk */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/75 dark:hover:bg-slate-900/75 hover:border-emerald-500/30 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-emerald-500/10 dark:text-emerald-500/5 group-hover:scale-110 transition-transform">
            <Users className="w-14 h-14" />
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Warga Aktif</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalPenduduk}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/30 w-fit px-1.5 py-0.5 rounded-md">
            <TrendingUp className="w-3 h-3" /> Jiwa
          </div>
        </div>

        {/* CARD Total KK */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/75 dark:hover:bg-slate-900/75 hover:border-emerald-500/30 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-teal-500/10 dark:text-teal-500/5 group-hover:scale-110 transition-transform">
            <Home className="w-14 h-14" />
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Kepala Keluarga</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalKeluarga}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-teal-500 font-bold bg-teal-50 dark:bg-teal-950/30 w-fit px-1.5 py-0.5 rounded-md">
            <FileCheck className="w-3 h-3" /> KK Terdaftar
          </div>
        </div>

        {/* CARD Laki-laki */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/75 dark:hover:bg-slate-900/75 hover:border-emerald-500/30 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-blue-500/10 dark:text-blue-500/5 group-hover:scale-110 transition-transform">
            <UserCheck className="w-14 h-14" />
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Laki-Laki</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalLaki}</p>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">
            {totalPenduduk > 0 ? ((totalLaki / totalPenduduk) * 100).toFixed(0) : 0}% dari populasi
          </p>
        </div>

        {/* CARD Perempuan */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/75 dark:hover:bg-slate-900/75 hover:border-emerald-500/30 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-purple-500/10 dark:text-purple-500/5 group-hover:scale-110 transition-transform">
            <UserCheck className="w-14 h-14 animate-pulse" />
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Perempuan</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalPerempuan}</p>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">
            {totalPenduduk > 0 ? ((totalPerempuan / totalPenduduk) * 100).toFixed(0) : 0}% dari populasi
          </p>
        </div>

        {/* CARD Balita */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/75 dark:hover:bg-slate-900/75 hover:border-emerald-500/30 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-pink-500/10 dark:text-pink-500/5 group-hover:scale-110 transition-transform">
            <Baby className="w-14 h-14" />
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Balita (0-5 thn)</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalBalita}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-pink-600 font-bold bg-pink-50 dark:bg-pink-950/30 w-fit px-1.5 py-0.5 rounded-md">
            Kesehatan Posyandu
          </div>
        </div>

        {/* CARD Lansia */}
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/75 dark:hover:bg-slate-900/75 hover:border-emerald-500/30 transition-all backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-amber-500/10 dark:text-amber-500/5 group-hover:scale-110 transition-transform">
            <HeartCrack className="w-14 h-14" />
          </div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Lansia (≥60 thn)</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalLansia}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/30 w-fit px-1.5 py-0.5 rounded-md">
            BLT Kesejahteraan
          </div>
        </div>

      </div>

      {/* DASHBOARD GRAPHS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph 1: Penduduk per RW */}
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between backdrop-blur-lg">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Demografi Penduduk per RW</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Membandingkan total penduduk setiap wilayah kelurahan</p>
          </div>
          <div className="h-64 w-full">
            {pendudukPerRwData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pendudukPerRwData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px", backgroundColor: "#fff" }} 
                    itemStyle={{ color: "#0f172a" }}
                  />
                  <Bar dataKey="Jumlah Penduduk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={34} />
                  <Bar dataKey="Kartu Keluarga" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data untuk diagram</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5 mt-2">
            Data mencakup seluruh sub-RT di bawah RW Anda.
          </div>
        </div>

        {/* Graph 2: Jenis Kelamin */}
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between backdrop-blur-lg">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Komposisi Jenis Kelamin</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Rasio Laki-laki dan Perempuan</p>
          </div>
          <div className="h-64 flex items-center justify-center relative">
            {genderData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="55%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric value badge */}
                <div className="absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{totalPenduduk}</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Warga</p>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400">Tidak ada data kuota warga</div>
            )}
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Laki-laki ({totalLaki})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-300">Perempuan ({totalPerempuan})</span>
            </div>
          </div>
        </div>

        {/* Graph 3: Pertumbuhan Penduduk */}
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm flex flex-col justify-between backdrop-blur-lg">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tren Pertumbuhan Registrasi</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Kumulatif pendaftaran data warga per-periode bulan</p>
          </div>
          <div className="h-64 w-full">
            {growthChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                  <Line type="monotone" dataKey="Total Penduduk Terdaftar" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Input Baru" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada linimasa pertumbuhan</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5 mt-2 flex items-center justify-between">
            <span>Siklus registrasi digital</span>
            <span className="font-semibold text-emerald-500 uppercase tracking-widest text-[9px]">Wargaluyu Elok</span>
          </div>
        </div>

      </div>

      {/* RECENT SUBMITTED AND AUDIT LOGS row layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column A: Data Terbaru Masuk */}
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Data Penduduk Masuk Terbaru</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Warga terdaftar di dalam sistem</p>
            </div>
            <button
              onClick={() => onNavigate("p_penduduk")}
              className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Lihat Semua <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {recentPenduduk.length > 0 ? (
              recentPenduduk.map((ped) => (
                <div key={ped.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-emerald-500/10 transition-colors">
                  <div className="w-9 h-9 rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-slate-100/50 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden text-emerald-600">
                    <img src={getCartoonAvatar(ped.jenisKelamin, ped.tanggalLahir, ped.namaLengkap)} alt="Avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{ped.namaLengkap}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">NIK: {ped.nik} | KK: {ped.noKk}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400">
                      RT {ped.rt} / RW {ped.rw}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">{hitungUmur(ped.tanggalLahir)} Tahun</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada penduduk terintegrasi</div>
            )}
          </div>
        </div>

        {/* Column B: Log Aktivitas Operator */}
        <div className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Log Aktivitas Terbaru</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Keamanan rekam jejak audit akses pilar RT/RW</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Live Logs
            </span>
          </div>

          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex gap-2 text-xs border-b border-slate-100 dark:border-slate-800/50 pb-3 last:border-b-0 last:pb-0">
                <span className="text-[9px] font-mono text-slate-450 dark:text-slate-500 shrink-0 select-none pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 dark:text-slate-300 text-xs">
                    <strong className="text-slate-800 dark:text-slate-200 underline decoration-slate-400/30">{log.nama}</strong>: {log.deskripsi}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
                    Peran: <span className="font-semibold">{log.role.replace("_", " ")}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
