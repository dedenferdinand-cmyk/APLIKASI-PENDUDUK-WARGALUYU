/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Settings, 
  User, 
  Trash2, 
  Database, 
  ShieldCheck, 
  HelpCircle, 
  Info, 
  CheckCircle, 
  Map,
  Activity,
  Terminal,
  Lock,
  RotateCcw
} from "lucide-react";
import { User as UserType } from "../types";
import { db } from "../db/mockSupabase";

interface PengaturanViewProps {
  currentUser: UserType;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
  onLogout: () => void;
}

export default function PengaturanView({ currentUser, addToast, onLogout }: PengaturanViewProps) {
  const [supabaseLoading, setSupabaseLoading] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  const [syncStatus, setSyncStatus] = React.useState<{ tableResult: any } | null>(null);
  const [hasBackup, setHasBackup] = React.useState(db.hasBackupBeforeReset());

  // Custom Confirmation Modal state to bypass browser window.confirm constraints inside sandboxed iframes
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const handleTestConnection = async () => {
    setSupabaseLoading(true);
    setConnectionStatus(null);
    try {
      const res = await db.testSupabaseConnection();
      setConnectionStatus(res);
      if (res.success) {
        addToast("Keterhubungan Supabase terverifikasi aktif!", "success");
      } else {
        addToast("Koneksi Supabase gagal. Silakan periksa kredensial Anda.", "error");
      }
    } catch (e: any) {
      setConnectionStatus({ success: false, message: e.message || "Gagal menghubungi Supabase." });
      addToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleUploadSupabase = () => {
    setConfirmModal({
      isOpen: true,
      title: "Unggah Data ke Supabase",
      message: "Apakah Anda yakin ingin MENGUNGGAH seluruh data kependudukan lokal saat ini ke database Supabase Anda? Ini akan melakukan UPSERT untuk memperbarui baris dengan ID yang sama di cloud.",
      onConfirm: async () => {
        setSupabaseLoading(true);
        try {
          const res = await db.uploadAllToSupabase();
          if (res.success) {
            setSyncStatus({ tableResult: res.details });
            addToast("Sinkronisasi unggah ke Supabase selesai!", "success");
          } else {
            addToast(res.message, "error");
          }
        } catch (e: any) {
          addToast(e.message || "Gagal mengunggah data.", "error");
        } finally {
          setSupabaseLoading(false);
        }
      }
    });
  };

  const handleDownloadSupabase = () => {
    setConfirmModal({
      isOpen: true,
      title: "Unduh Data dari Supabase",
      message: "Apakah Anda yakin ingin MENGUNDUH seluruh data dari Supabase Anda? PERINGATAN: Ini akan menimpa seluruh data lokal di perangkat/browser ini berdasarkan entri aktif di cloud!",
      onConfirm: async () => {
        setSupabaseLoading(true);
        try {
          const res = await db.downloadAllFromSupabase();
          if (res.success) {
            setSyncStatus({ tableResult: res.details });
            addToast("Sinkronisasi unduh dari Supabase berhasil diterapkan!", "success");
          } else {
            addToast(res.message, "error");
          }
        } catch (e: any) {
          addToast(e.message || "Gagal mengunduh data.", "error");
        } finally {
          setSupabaseLoading(false);
        }
      }
    });
  };
  
  const handleResetDatabase = () => {
    if (currentUser.role !== "ADMIN_DESA") {
      addToast("Hanya Administrator Desa yang berwenang melakukan pembersihan instansi database!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Bersihkan Database Kependudukan",
      message: "WARNING: Anda akan menimpa seluruh entri arsip kependudukan, KK, kelahiran, mutasi, dan log audit saat ini kembali ke draf default bawaan pabrik! Lanjutkan pembersihan database?",
      onConfirm: () => {
        try {
          db.resetDatabase(currentUser);
          addToast("Database kependudukan berhasil di-reset ke kondisi awal!", "success");
          setHasBackup(true);
          // Trigger simple logout so session recreates with fresh data
          setTimeout(() => {
            onLogout();
            addToast("Sesi di-reset. Silakan masuk kembali.", "info");
          }, 1000);
        } catch (e: any) {
          addToast(e.message || "Gagal mereset database.", "error");
        }
      }
    });
  };

  const handleWipeDatabase = () => {
    if (currentUser.role !== "ADMIN_DESA") {
      addToast("Hanya Administrator Desa yang berwenang mengosongkan database!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Kosongkan Seluruh Database",
      message: "PERINGATAN KRITIS: Anda akan menghapus SELURUH entri kependudukan, KK, kelahiran, mutasi, log audit, DAN daftar wilayah dusun/RW/RT saat ini (menjadi draf kosong total untuk mulai dari nol). Tindakan ini masih bisa diurungkan (undo) sebelum Anda menutup browser. Apakah Anda benar-benar yakin?",
      onConfirm: () => {
        try {
          db.wipeDatabase(currentUser);
          addToast("Seluruh database berhasil dikosongkan (Mulai dari Nol)!", "success");
          setHasBackup(true);
          // Trigger simple logout so session recreates with empty data
          setTimeout(() => {
            onLogout();
            addToast("Sesi dikosongkan. Silakan masuk kembali.", "info");
          }, 1000);
        } catch (e: any) {
          addToast(e.message || "Gagal mengosongkan database.", "error");
        }
      }
    });
  };

  const handleUndoReset = () => {
    if (currentUser.role !== "ADMIN_DESA") {
      addToast("Hanya Administrator Desa yang berwenang memulihkan cadangan!", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Urungkan Reset & Pulihkan Data",
      message: "Apakah Anda yakin ingin membatalkan pembersihan database terakhir dan memulihkan seluruh data kependudukan lokal sebelum di-reset?",
      onConfirm: () => {
        try {
          db.undoResetDatabase(currentUser);
          addToast("Cadangan berhasil dipulihkan! Seluruh data Anda sebelum reset telah kembali.", "success");
          setHasBackup(false);
          setTimeout(() => {
            onLogout();
            addToast("Sesi dipulihkan. Silakan masuk kembali.", "info");
          }, 1000);
        } catch (e: any) {
          addToast(e.message || "Gagal memulihkan cadangan.", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* View Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-500 animate-spin-slow" /> Pengaturan Sistem (SIDEWA)
        </h2>
        <p className="text-xs text-slate-400 mt-1">Mengurus profil operator aktif, memonitor status integrasi PostgreSQL, dan memelihara server database.</p>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Profile Operator */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-405 flex items-center gap-1.5"><User className="w-4 h-4 text-emerald-500" /> Profil Operator Aktif</h3>
          
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-805 bg-slate-50/50 dark:bg-slate-950/25">
            <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-900 overflow-hidden font-extrabold text-white flex items-center justify-center shrink-0">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Operator Avatar" className="w'full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.nama.substring(0,1)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">{currentUser.nama}</h4>
              <p className="text-[10px] text-slate-450 mt-1 uppercase font-mono font-bold tracking-wider text-emerald-600">ID: {currentUser.username}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-450">Tingkat Peran:</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">{currentUser.role.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-450">Lingkup Wilayah Kerja:</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">
                {currentUser.role === "ADMIN_DESA" ? "Seluruh Desa Wargaluyu" : `RW ${currentUser.rw} ${currentUser.rt ? `/ RT ${currentUser.rt}` : ""}`}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-450">Status Autentikasi:</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> AKTIF/ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: PostgreSQL Supabase Metadata */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-405 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-500" /> PostgreSQL & Supabase Engine
          </h3>
          
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-slate-500">
                <strong>Supabase Live Cloud Enabled:</strong> Sinkronisasi server berjalan paralel saat Anda mengedit warga lokal atau operator.
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">URI Host Supabase</span>
              <code className="text-[10px] block font-mono bg-slate-100 dark:bg-slate-950 px-2 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 break-all select-all">
                https://ksdrnwryfrwbvysskdim.supabase.co
              </code>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={handleTestConnection}
                disabled={supabaseLoading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-[10px] uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 h-[38px]"
              >
                {supabaseLoading ? "Memproses..." : "Uji Koneksi Supabase"}
              </button>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                <button
                  onClick={handleUploadSupabase}
                  disabled={supabaseLoading}
                  className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition border border-transparent hover:border-emerald-500/30 font-extrabold"
                >
                  Unggah Lokal ↑
                </button>
                <button
                  onClick={handleDownloadSupabase}
                  disabled={supabaseLoading}
                  className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition border border-transparent hover:border-emerald-500/30 font-extrabold"
                >
                  Unduh Cloud ↓
                </button>
              </div>
            </div>

            {connectionStatus && (
              <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed font-semibold border ${
                connectionStatus.success 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                  : "bg-rose-500/5 text-rose-500 border-rose-500/20"
              }`}>
                {connectionStatus.message}
              </div>
            )}

            {syncStatus && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[10px] space-y-1">
                <div className="font-bold border-b border-slate-200 dark:border-slate-800 pb-1 mb-1 text-slate-700 dark:text-slate-300">Hasil Sinkron Tabel:</div>
                {Object.entries(syncStatus.tableResult).map(([table, outcome]) => (
                  <div key={table} className="flex justify-between font-mono text-[9px]">
                    <span className="text-slate-400">{table}:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{(outcome as string)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Master Reset (Admin Only) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-rose-500 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Pemeliharaan & Reset Database
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Konfigurasi ini digunakan oleh administrator untuk menghapus seluruh perubahan demo harian dan mengembalikan data penduduk default Desa Wargaluyu ke kondisi awal.
            </p>

            {currentUser.role !== "ADMIN_DESA" && (
              <div className="mt-3.5 p-3 rounded-lg bg-slate-100 dark:bg-slate-950/40 text-[10px] text-slate-450 dark:text-slate-500 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Reset database dikunci untuk peran RW/RT demi keamanan draf sistem.</span>
              </div>
            )}
          </div>

          {currentUser.role === "ADMIN_DESA" ? (
            <div className="space-y-2.5 mt-6">
              {hasBackup && (
                <button
                  id="btn-database-undo-reset"
                  onClick={handleUndoReset}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition-all text-xs cursor-pointer shadow-sm active:scale-[0.98] animate-pulse"
                >
                  <RotateCcw className="w-4 h-4" /> Urungkan Reset & Pulihkan Data
                </button>
              )}
              <button
                id="btn-database-wipe"
                onClick={handleWipeDatabase}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold transition-all text-xs cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" /> Kosongkan Database (Mulai dari Nol)
              </button>
              <button
                id="btn-database-reset"
                onClick={handleResetDatabase}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold transition-all text-[11px] cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Reset ke Demo Default (Bawaan)
              </button>
            </div>
          ) : (
            <div className="mt-6 p-2 rounded bg-slate-50 dark:bg-slate-955 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none border border-slate-200/30">
              Hak Akses Terkunci
            </div>
          )}
        </div>

      </div>

      {/* INTEGRATION & DEPLOYMENT GUIDE (Supabase & Netlify) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/20 text-white border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" /> Panduan Integrasi Supabase & Netlify
            </h3>
            <p className="text-xs text-slate-400">Ikuti langkah berikut untuk menerapkan penyimpanan Supabase asli & deploy instan di Netlify.</p>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            Ready for Production
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Supabase Guideline */}
          <div className="space-y-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5">Penyimpanan Supabase Asli</h4>
            </div>
            
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Draf engine dirancang siap sinkronisasi real-time multi-perangkat. Agar akun baru & data sinkron sempurna antara Laptop dan HP, pastikan tabel Anda di Supabase dibuat dengan format <strong>camelCase (menggunakan tanda kutip ganda pada SQL)</strong> agar cocok dengan skema aplikasi, serta nonaktifkan RLS atau buat policy agar data tidak terbaca kosong.
            </p>

            <details className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] group transition-all duration-200">
              <summary className="font-bold text-emerald-400 list-none flex items-center gap-1 cursor-pointer select-none">
                <span className="transition-transform group-open:rotate-90 text-[8px] inline-block">▶</span>
                <span>Salin Script SQL Pembuat Tabel</span>
              </summary>
              <pre className="mt-2.5 p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto text-[9px] text-slate-300 leading-normal max-h-[180px] select-all scrollbar-thin">
{`-- SCRIPT DATABASE SIDEWA DESA WARGALUYU
-- Salin & jalankan di SQL Editor Supabase Anda:

-- 1. Tabel users
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL,
    rw TEXT,
    rt TEXT,
    password TEXT,
    avatar TEXT
);

-- 2. Tabel keluarga
CREATE TABLE IF NOT EXISTS public.keluarga (
    id TEXT PRIMARY KEY,
    "noKk" TEXT NOT NULL,
    "kepalaKeluargaId" TEXT,
    "kepalaKeluargaNama" TEXT,
    alamat TEXT,
    rw TEXT NOT NULL,
    rt TEXT NOT NULL,
    "jumlahAnggota" INTEGER DEFAULT 1
);

-- 3. Tabel penduduk
CREATE TABLE IF NOT EXISTS public.penduduk (
    id TEXT PRIMARY KEY,
    nik TEXT NOT NULL,
    "noKk" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TEXT,
    "jenisKelamin" TEXT,
    agama TEXT,
    pendidikan TEXT,
    pekerjaan TEXT,
    "statusPerkawinan" TEXT,
    "statusHubungan" TEXT,
    kewarganegaraan TEXT,
    "noHp" TEXT,
    "statusTinggal" TEXT,
    rw TEXT NOT NULL,
    rt TEXT NOT NULL,
    avatar TEXT,
    "tanggalInput" TEXT
);

-- 4. Tabel kelahiran
CREATE TABLE IF NOT EXISTS public.kelahiran (
    id TEXT PRIMARY KEY,
    "nikBayi" TEXT,
    "namaBayi" TEXT NOT NULL,
    "namaAyah" TEXT,
    "namaIbu" TEXT,
    "tanggalLahir" TEXT,
    rw TEXT NOT NULL,
    rt TEXT NOT NULL,
    "tanggalInput" TEXT
);

-- 5. Tabel kematian
CREATE TABLE IF NOT EXISTS public.kematian (
    id TEXT PRIMARY KEY,
    nik TEXT NOT NULL,
    nama TEXT NOT NULL,
    "tanggalMeninggal" TEXT,
    "sebabKematian" TEXT,
    rw TEXT NOT NULL,
    rt TEXT NOT NULL,
    "tanggalInput" TEXT
);

-- 6. Tabel mutasi
CREATE TABLE IF NOT EXISTS public.mutasi (
    id TEXT PRIMARY KEY,
    "jenisMutasi" TEXT NOT NULL,
    nik TEXT NOT NULL,
    nama TEXT NOT NULL,
    "alamatAsal" TEXT,
    "alamatTujuan" TEXT,
    "tanggalMutasi" TEXT,
    rw TEXT NOT NULL,
    rt TEXT NOT NULL,
    "tanggalInput" TEXT
);

-- 7. Tabel logs
CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    username TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- 8. Tabel wilayah
CREATE TABLE IF NOT EXISTS public.wilayah (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    rws JSONB NOT NULL
);

-- DISABLE RLS UNTUK DEMO & CO-WORKING TANPA LOGIN SUPABASE AUTH
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.keluarga DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.penduduk DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelahiran DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kematian DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah DISABLE ROW LEVEL SECURITY;`}
              </pre>
            </details>

            <div className="p-3.5 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-slate-455 block uppercase">Tambahkan Variabel Lingkungan (.env):</span>
              <code className="block font-mono text-[10px] text-emerald-555">VITE_SUPABASE_URL=https://your-proj.supabase.co</code>
              <code className="block font-mono text-[10px] text-emerald-555">VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...</code>
            </div>
          </div>

          {/* Netlify Guideline */}
          <div className="space-y-4 bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5">Langkah Deploy ke Netlify</h4>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              Netlify akan secara otomatis mengompilasi kode program React/Vite ini menjadi file statis super cepat.
            </p>

            <ol className="space-y-2.5 leading-relaxed text-slate-300 text-[11px]">
              <li className="flex gap-2">
                <span className="font-bold text-emerald-400 shrink-0">A:</span>
                <span>Hubungkan repositori Anda ke GitHub/GitLab.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-400 shrink-0">B:</span>
                <span>Daftarkan repositori tersebut di dasbor utama Netlify.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-400 shrink-0">C:</span>
                <span>Gunakan build command: <code className="bg-slate-950 text-emerald-400 px-1 py-0.5 rounded font-mono text-[10px]">npm run build</code> dan publish directory: <code className="bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[10px]">dist</code>.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-400 shrink-0">D:</span>
                <span>Buka menu <strong className="text-slate-100">Site Configuration → Environment Variables</strong> di Netlify, lalu daftarkan kredensial Supabase Anda di sana agar tersambung penuh secara realtime.</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{confirmModal.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-3.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
