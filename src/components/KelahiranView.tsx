/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Baby, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  User,
  Calendar,
  Layers,
  MapPin,
  ClipboardCopy
} from "lucide-react";
import { User as UserType, Kelahiran, Keluarga, Penduduk } from "../types";
import { db, getCartoonAvatar } from "../db/mockSupabase";

interface KelahiranViewProps {
  currentUser: UserType;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function KelahiranView({ currentUser, addToast }: KelahiranViewProps) {
  const [kelahiranList, setKelahiranList] = useState<Kelahiran[]>([]);
  const [kkList, setKkList] = useState<Keluarga[]>([]);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRw, setFilterRw] = useState("");
  const [filterRt, setFilterRt] = useState("");

  // Pagination bounds
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [punyaNik, setPunyaNik] = useState<"YA" | "BELUM">("BELUM");
  const [nikBayi, setNikBayi] = useState("");
  const [namaBayi, setNamaBayi] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [rw, setRw] = useState("");
  const [rt, setRt] = useState("");
  const [targetNoKk, setTargetNoKk] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");

  // Custom Confirmation Modal state to bypass browser window.confirm constraints inside sandboxed iframes
  const [confirmModal, setConfirmModal] = useState<{
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

  useEffect(() => {
    fetchData();

    const handleSync = () => {
      fetchData();
    };
    window.addEventListener("sipenduk-db-updated", handleSync);
    return () => {
      window.removeEventListener("sipenduk-db-updated", handleSync);
    };
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const data = await db.getKelahiran(currentUser);
      setKelahiranList(data);
      const kks = await db.getKeluarga(currentUser);
      setKkList(kks);
    } catch (err: any) {
      addToast("Gagal memuat data kelahiran: " + err.message, "error");
    }
  };

  const openInsertForm = () => {
    setPunyaNik("BELUM");
    setNikBayi("");
    setNamaBayi("");
    setNamaAyah("");
    setNamaIbu("");
    setTanggalLahir(new Date().toISOString().split("T")[0]);
    setTargetNoKk("");
    setJenisKelamin("L");
    
    const dynamicRwList = Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b));
    const defaultRw = dynamicRwList[0] || "01";
    const dynamicRtList = Array.from(new Set([...db.getRtList(currentUser.rw || defaultRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b));
    const defaultRt = dynamicRtList[0] || "01";

    if (currentUser.role === "KETUA_RT") {
      setRw(currentUser.rw || defaultRw);
      setRt(currentUser.rt || defaultRt);
    } else if (currentUser.role === "KETUA_RW") {
      setRw(currentUser.rw || defaultRw);
      setRt(defaultRt);
    } else {
      setRw(defaultRw);
      setRt(defaultRt);
    }

    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus Pencatatan Lahir",
      message: "Apakah Anda yakin ingin menghapus arsip pencatatan kelahiran bayi ini?",
      onConfirm: async () => {
        try {
          const success = await db.deleteKelahiran(id, currentUser);
          if (success) {
            addToast("Catatan kelahiran berhasil dihapus dari arsip.", "success");
            fetchData();
          } else {
            addToast("Gagal menghapus catatan kelahiran.", "warning");
          }
        } catch (err: any) {
          addToast(err.message || "Gagal menghapus catatan.", "error");
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaBayi.trim() || !namaAyah.trim() || !namaIbu.trim() || !tanggalLahir) {
      addToast("Harap isi semua informasi kelahiran!", "warning");
      return;
    }

    if (punyaNik === "YA") {
      if (nikBayi.length !== 16 || !/^\d+$/.test(nikBayi)) {
        addToast("Nomor NIK bayi harus 16 digit angka!", "warning");
        return;
      }
    }

    const finalNik = punyaNik === "YA" ? nikBayi.trim() : "";

    // Decide which RT and RW to use (if KK selected, use KK's; else use form's)
    let finalRt = rt.padStart(2, "0");
    let finalRw = rw.padStart(2, "0");
    
    if (targetNoKk) {
      const selectedKk = kkList.find(k => k.noKk === targetNoKk);
      if (selectedKk) {
        finalRt = selectedKk.rt;
        finalRw = selectedKk.rw;
      }
    }

    const payload = {
      nikBayi: finalNik,
      namaBayi: namaBayi.trim(),
      namaAyah: namaAyah.trim(),
      namaIbu: namaIbu.trim(),
      tanggalLahir,
      rw: finalRw,
      rt: finalRt,
      noKk: targetNoKk || undefined
    };

    try {
      await db.insertKelahiran(payload, currentUser);
      
      // Automatically register as a resident (Penduduk) if targetNoKk is selected
      if (targetNoKk) {
        const generatedNik = finalNik || ("3204" + Math.floor(100000000000 + Math.random() * 900000000000).toString());

        const pendudukPayload: Omit<Penduduk, "id" | "tanggalInput"> = {
          nik: generatedNik,
          noKk: targetNoKk,
          namaLengkap: namaBayi.trim(),
          tempatLahir: "Wargaluyu",
          tanggalLahir: tanggalLahir,
          jenisKelamin: jenisKelamin,
          agama: "Islam",
          pendidikan: "Tidak / Belum Sekolah",
          pekerjaan: "BELUM/TIDAK BEKERJA",
          statusPerkawinan: "Belum Kawin",
          statusHubungan: "Anak",
          kewarganegaraan: "WNI",
          noHp: "",
          statusTinggal: "Tetap",
          rt: finalRt,
          rw: finalRw,
          avatar: getCartoonAvatar(jenisKelamin, tanggalLahir, namaBayi.trim()),
          isDisabilitas: false,
          jenisDisabilitas: ""
        };

        await db.insertPenduduk(pendudukPayload, currentUser);
      }

      if (targetNoKk) {
        addToast(`Data kelahiran bayi ${namaBayi} berhasil didaftarkan & otomatis dimasukkan ke anggota keluarga KK No. ${targetNoKk}!`, "success");
      } else {
        addToast(`Data kelahiran bayi ${namaBayi} berhasil didaftarkan.`, "success");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.message || "Gagal mencatat mutasi kelahiran.", "error");
    }
  };

  // Filters
  const filteredList = kelahiranList.filter(k => {
    const matchesSearch = 
      k.namaBayi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.namaAyah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.namaIbu.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRw = filterRw === "" || k.rw === filterRw;
    const matchesRt = filterRt === "" || k.rt === filterRt;

    return matchesSearch && matchesRw && matchesRt;
  });

  // Pages
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Title Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Baby className="w-5 h-5 text-emerald-500" /> Pencatatan Kelahiran Bayi
          </h2>
          <p className="text-xs text-slate-400 mt-1">Mencatat kelahiran baru untuk penerbitan biodata keluarga posyandu.</p>
        </div>

        <button
          id="btn-add-kelahiran"
          onClick={openInsertForm}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Catat Kelahiran Baru
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row gap-3">
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-kelahiran"
            type="text"
            placeholder="Cari berdasarkan nama bayi, ayah, atau ibu..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-xs transition-all font-medium"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          {currentUser.role === "ADMIN_DESA" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">RW:</span>
              <select
                value={filterRw}
                onChange={(e) => {
                  setFilterRw(e.target.value);
                  setFilterRt("");
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none"
              >
                <option value="">Semua RW</option>
                {Array.from(new Set([...db.getRwList(), "01", "02"])).sort((a,b) => a.localeCompare(b)).map(rwNum => (
                  <option key={rwNum} value={rwNum}>RW {rwNum}</option>
                ))}
              </select>
            </div>
          )}

          {currentUser.role !== "KETUA_RT" && (
            <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-1 bg-white border border-slate-200 dark:border-slate-805 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">RT:</span>
              <select
                value={filterRt}
                onChange={(e) => {
                  setFilterRt(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-705 dark:text-slate-200 focus:outline-none"
              >
                <option value="">Semua RT</option>
                {Array.from(new Set([...db.getRtList(currentUser.role === "KETUA_RW" ? currentUser.rw : filterRw), "01", "02", "03"])).sort((a,b) => a.localeCompare(b)).map(rtNum => (
                  <option key={rtNum} value={rtNum}>RT {rtNum}</option>
                ))}
              </select>
            </div>
          )}
        </div>

      </div>

      {/* TABLE BOX SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-955/20 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3.5">Nama Bayi</th>
                <th className="px-5 py-3.5">Prakiraan NIK (Akan Datang)</th>
                <th className="px-5 py-3.5">Nama Ibu Kandung</th>
                <th className="px-5 py-3.5">Nama Ayah</th>
                <th className="px-5 py-3.5 text-center">Tanggal Lahir</th>
                <th className="px-5 py-3.5 text-center">RT / RW</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedList.length > 0 ? (
                paginatedList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                    <td className="px-5 py-4 text-slate-800 dark:text-slate-150">
                      <div className="flex items-center gap-2">
                        <div className="w-6.5 h-6.5 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                          <Baby className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold">{k.namaBayi}</p>
                          {k.noKk ? (
                            <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded mt-0.5">
                              ✓ Masuk KK: {k.noKk}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.2 rounded mt-0.5">
                              Hanya Catatan Lahir
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {k.nikBayi ? (
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                          {k.nikBayi}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 animate-pulse">
                          ⚠️ Belum Ada NIK (Harus Update KK)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-350">{k.namaIbu}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-355">{k.namaAyah}</td>
                    <td className="px-5 py-4 text-center text-slate-650 dark:text-slate-350 font-mono">
                      {new Date(k.tanggalLahir).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        RT {k.rt} / RW {k.rw}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:border-rose-500/30 text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer inline-flex items-center"
                        title="Hapus pencatatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <Baby className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                    Tidak ada catatan kelahiran terintegrasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL FOOTER */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-450 dark:text-slate-500">
          <span>Menampilkan <strong>{Math.min(filteredList.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredList.length, currentPage * itemsPerPage)}</strong> dari <strong>{filteredList.length}</strong> bayi</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold font-mono">Halaman {currentPage} dari {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-805 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FORM DIALOG POPUP MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/10">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Baby className="w-4 h-4 text-emerald-500" /> Pencatatan Kelahiran Bayi Baru
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-450 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apakah Bayi Sudah Memiliki NIK?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPunyaNik("YA")}
                    className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      punyaNik === "YA"
                        ? "bg-emerald-600/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900"
                    }`}
                  >
                    Sudah Punya NIK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPunyaNik("BELUM");
                      setNikBayi("");
                    }}
                    className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                      punyaNik === "BELUM"
                        ? "bg-slate-200 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900"
                    }`}
                  >
                    Belum Punya NIK
                  </button>
                </div>
              </div>

              {punyaNik === "YA" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor NIK Bayi (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    required
                    placeholder="Isi 3204XXXXXXXXXXXXXXXX"
                    value={nikBayi}
                    onChange={(e) => setNikBayi(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs font-mono tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Bayi Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap bayi"
                  value={namaBayi}
                  onChange={(e) => setNamaBayi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Lengkap Ibu Kandung</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama ibu kandung"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Lengkap Ayah Kandung</label>
                <input
                  type="text"
                  required
                  placeholder="Ayah kandung bayi"
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hubungkan Otomatis ke Kartu Keluarga (KK)</label>
                <select
                  value={targetNoKk}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTargetNoKk(val);
                    if (val) {
                      const foundKk = kkList.find(k => k.noKk === val);
                      if (foundKk) {
                        setRt(foundKk.rt);
                        setRw(foundKk.rw);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-medium"
                >
                  <option value="">-- Hanya Catat Kelahiran (Tidak Masuk KK) --</option>
                  {kkList.map(k => (
                    <option key={k.id} value={k.noKk}>
                      KK {k.noKk} (K.K: {k.kepalaKeluargaNama} - RT {k.rt}/RW {k.rw})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 mt-0.5">Jika dipilih, bayi akan otomatis terdaftar sebagai anggota keluarga (anak) di data kependudukan.</p>
              </div>

              {targetNoKk && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jenis Kelamin Bayi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setJenisKelamin("L")}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        jenisKelamin === "L"
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900"
                      }`}
                    >
                      Laki-Laki (L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisKelamin("P")}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        jenisKelamin === "P"
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                          : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900"
                      }`}
                    >
                      Perempuan (P)
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Kelahiran</label>
                  <input
                    type="date"
                    required
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RT / RW</label>
                  <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/50 text-xs font-bold text-center text-slate-450 dark:text-slate-400 self-center mt-0.5">
                    {rt}/{rw}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-105 rounded-xl text-xs font-semibold text-slate-450 dark:text-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Catat Bayi Lahir
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
